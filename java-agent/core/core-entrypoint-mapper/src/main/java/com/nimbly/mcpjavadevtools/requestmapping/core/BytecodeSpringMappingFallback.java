package com.nimbly.mcpjavadevtools.requestmapping.core;

import com.nimbly.mcpjavadevtools.requestmapping.api.ResolverRequest;
import org.objectweb.asm.ClassReader;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public final class BytecodeSpringMappingFallback {
    private static final List<String> NO_PATH = List.of("");

    private final List<Path> classRoots;
    private final Map<String, BytecodeParsedClass> cache = new HashMap<>();

    private BytecodeSpringMappingFallback(List<Path> classRoots) {
        this.classRoots = classRoots;
    }

    public static Optional<BytecodeResolvedEndpoint> resolve(
            ResolverRequest request,
            List<Path> scanRoots,
            String primaryFqcn
    ) {
        if (request == null || primaryFqcn == null || primaryFqcn.isBlank()) {
            return Optional.empty();
        }
        List<Path> classRoots = discoverClassRoots(scanRoots);
        if (classRoots.isEmpty()) {
            return Optional.empty();
        }
        return new BytecodeSpringMappingFallback(classRoots).resolveInternal(request, primaryFqcn);
    }

    private Optional<BytecodeResolvedEndpoint> resolveInternal(ResolverRequest request, String primaryFqcn) {
        Optional<BytecodeParsedClass> primaryOpt = parseClass(primaryFqcn);
        if (primaryOpt.isEmpty()) {
            return Optional.empty();
        }
        BytecodeParsedClass primary = primaryOpt.get();
        List<String> primaryClassPaths = primary.classPaths.isEmpty() ? NO_PATH : primary.classPaths;

        List<BytecodeEndpointCandidate> candidates = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Deque<String> queue = new ArrayDeque<>();
        queue.add(primary.fqcn);
        while (!queue.isEmpty()) {
            String ownerFqcn = queue.removeFirst();
            if (!visited.add(ownerFqcn)) {
                continue;
            }
            Optional<BytecodeParsedClass> ownerOpt = parseClass(ownerFqcn);
            if (ownerOpt.isEmpty()) {
                continue;
            }
            BytecodeParsedClass owner = ownerOpt.get();
            for (BytecodeParsedMethod method : owner.methods) {
                if (!request.methodHint.equals(method.name())) {
                    continue;
                }
                if (method.mappings().isEmpty()) {
                    continue;
                }
                List<String> ownerClassPaths = owner.classPaths.isEmpty() ? NO_PATH : owner.classPaths;
                for (BytecodeSpringMapping mapping : method.mappings()) {
                    for (String primaryPath : primaryClassPaths) {
                        for (String ownerPath : ownerClassPaths) {
                            String ownerContribution = owner.fqcn.equals(primary.fqcn) ? "" : ownerPath;
                            for (String methodPath : mapping.paths()) {
                                String mergedPath = mergePath(primaryPath, ownerContribution, methodPath);
                                candidates.add(new BytecodeEndpointCandidate(
                                        mapping.httpMethod(),
                                        mergedPath,
                                        owner.fqcn
                                ));
                            }
                        }
                    }
                }
            }
            if (owner.superFqcn != null && !owner.superFqcn.isBlank() && !"java.lang.Object".equals(owner.superFqcn)) {
                queue.addLast(owner.superFqcn);
            }
            queue.addAll(owner.interfaceFqcns);
        }

        Map<String, BytecodeEndpointCandidate> unique = new HashMap<>();
        for (BytecodeEndpointCandidate candidate : candidates) {
            unique.put(candidate.httpMethod() + " " + candidate.path(), candidate);
        }
        if (unique.size() != 1) {
            return Optional.empty();
        }
        BytecodeEndpointCandidate selected = unique.values().iterator().next();
        return Optional.of(new BytecodeResolvedEndpoint(selected.httpMethod(), selected.path(), selected.ownerFqcn(), unique.size()));
    }

    private Optional<BytecodeParsedClass> parseClass(String fqcn) {
        BytecodeParsedClass cached = cache.get(fqcn);
        if (cached != null) {
            return Optional.of(cached);
        }
        Path classFile = findClassFile(fqcn);
        if (classFile == null) {
            return Optional.empty();
        }
        try {
            ClassReader reader = new ClassReader(Files.readAllBytes(classFile));
            ParsedClassVisitor visitor = new ParsedClassVisitor();
            reader.accept(visitor, ClassReader.SKIP_CODE | ClassReader.SKIP_DEBUG | ClassReader.SKIP_FRAMES);
            BytecodeParsedClass parsed = visitor.toParsedClass();
            if (parsed == null) {
                return Optional.empty();
            }
            cache.put(fqcn, parsed);
            return Optional.of(parsed);
        } catch (IOException ignored) {
            return Optional.empty();
        }
    }

    private Path findClassFile(String fqcn) {
        String rel = fqcn.replace('.', '/') + ".class";
        for (Path root : classRoots) {
            Path candidate = root.resolve(rel);
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private static List<Path> discoverClassRoots(List<Path> scanRoots) {
        Set<Path> out = new LinkedHashSet<>();
        for (Path scanRoot : scanRoots) {
            if (scanRoot == null || !Files.isDirectory(scanRoot)) {
                continue;
            }
            for (Path moduleRoot : SourceRootsScanner.discoverModuleRoots(scanRoot)) {
                Path mavenClasses = moduleRoot.resolve("target/classes");
                if (Files.isDirectory(mavenClasses)) {
                    out.add(mavenClasses.toAbsolutePath().normalize());
                }
                Path gradleClasses = moduleRoot.resolve("build/classes/java/main");
                if (Files.isDirectory(gradleClasses)) {
                    out.add(gradleClasses.toAbsolutePath().normalize());
                }
            }
        }
        return new ArrayList<>(out);
    }

    private static String mergePath(String classPath, String inheritedClassPath, String methodPath) {
        String merged = normalizeSegment(classPath);
        merged = appendSegment(merged, normalizeSegment(inheritedClassPath));
        merged = appendSegment(merged, normalizeSegment(methodPath));
        if (merged.isBlank()) {
            return "/";
        }
        if (!merged.startsWith("/")) {
            return "/" + merged;
        }
        return merged;
    }

    private static String appendSegment(String current, String next) {
        if (next.isBlank() || "/".equals(next)) {
            return current;
        }
        if (current.isBlank() || "/".equals(current)) {
            return next.startsWith("/") ? next : "/" + next;
        }
        String left = current.endsWith("/") ? current.substring(0, current.length() - 1) : current;
        String right = next.startsWith("/") ? next.substring(1) : next;
        return left + "/" + right;
    }

    private static String normalizeSegment(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        if ("/".equals(trimmed)) {
            return "/";
        }
        if (!trimmed.startsWith("/")) {
            return "/" + trimmed;
        }
        return trimmed;
    }
}
