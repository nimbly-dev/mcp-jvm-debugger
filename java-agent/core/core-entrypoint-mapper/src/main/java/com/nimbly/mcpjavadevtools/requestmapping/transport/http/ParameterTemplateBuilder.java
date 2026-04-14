package com.nimbly.mcpjavadevtools.requestmapping.transport.http;

import com.github.javaparser.ast.type.Type;

import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.function.Predicate;

public final class ParameterTemplateBuilder {
    private static volatile RequestTemplateProfile profile = RequestTemplateProfile.defaults();

    private static final List<NameRule> QUERY_NAME_RULES = List.of(
            new NameRule(ParameterTemplateBuilder::isSortParameter, "priceSale,asc")
    );

    private static final List<TypeRule> QUERY_TYPE_RULES = List.of(
            new TypeRule(type -> containsAny(type, "localdatetime", "offsetdatetime"), "2026-01-01T00:00:00"),
            new TypeRule(type -> containsAny(type, "localdate"), "2026-01-01"),
            new TypeRule(type -> containsAny(type, "instant"), "2026-01-01T00:00:00Z"),
            new TypeRule(type -> containsAny(type, "uuid"), "00000000-0000-0000-0000-000000000001"),
            new TypeRule(type -> containsAny(type, "double", "float", "decimal"), "1000"),
            new TypeRule(type -> containsAny(type, "int", "long", "short"), "1"),
            new TypeRule(type -> containsAny(type, "bool"), "true")
    );

    private static final List<TypeRule> BODY_TYPE_RULES = List.of(
            new TypeRule(type -> containsAny(type, "string"), "\"value\""),
            new TypeRule(type -> containsAny(type, "int", "long", "double", "float"), "1"),
            new TypeRule(type -> containsAny(type, "bool"), "true")
    );

    private ParameterTemplateBuilder() {
    }

    public static void configureForProjectRoot(Path projectRoot) {
        profile = RequestTemplateProfile.load(projectRoot);
    }

    public static String activeProfileSource() {
        return profile.source();
    }

    public static String fallbackQuerySample() {
        return RequestTemplateProfileConstants.DEFAULT_QUERY_SAMPLE;
    }

    public static String fallbackBodySample() {
        return RequestTemplateProfileConstants.DEFAULT_BODY_SAMPLE;
    }

    public static String sampleValueForType(Type type) {
        String normalizedType = normalizeType(type);
        for (TypeRule rule : QUERY_TYPE_RULES) {
            if (rule.matches(normalizedType)) {
                return rule.sampleValue();
            }
        }
        return profile.defaultQuerySample();
    }

    public static String sampleValueForParameter(String parameterName, Type type) {
        String querySampleOverride = profile.querySampleForParam(parameterName);
        if (querySampleOverride != null) {
            return querySampleOverride;
        }
        String normalizedName = normalizeName(parameterName);
        for (NameRule rule : QUERY_NAME_RULES) {
            if (rule.matches(normalizedName)) {
                return rule.sampleValue();
            }
        }
        return sampleValueForType(type);
    }

    public static String samplePathValueForParameter(String parameterName, Type type) {
        String pathSampleOverride = profile.pathSampleForParam(parameterName);
        if (pathSampleOverride != null) {
            return pathSampleOverride;
        }
        return sampleValueForParameter(parameterName, type);
    }

    public static String sampleBodyForType(Type type) {
        String normalizedType = normalizeType(type);
        for (TypeRule rule : BODY_TYPE_RULES) {
            if (rule.matches(normalizedType)) {
                return rule.sampleValue();
            }
        }
        return profile.defaultBodySample();
    }

    public static String sampleBodyForParameter(String parameterName, Type type) {
        String bodySampleOverride = profile.bodySampleForParam(parameterName);
        if (bodySampleOverride != null) {
            return bodySampleOverride;
        }
        return sampleBodyForType(type);
    }

    private static String normalizeType(Type type) {
        return type.asString().toLowerCase(Locale.ROOT);
    }

    private static String normalizeName(String parameterName) {
        return parameterName == null ? "" : parameterName.toLowerCase(Locale.ROOT);
    }

    private static boolean isSortParameter(String normalizedName) {
        return normalizedName.equals("sort")
                || normalizedName.endsWith("sort")
                || normalizedName.contains("orderby")
                || normalizedName.contains("sortby");
    }

    private static boolean containsAny(String raw, String... candidates) {
        for (String candidate : candidates) {
            if (raw.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private record TypeRule(Predicate<String> matcher, String sampleValue) {
        private boolean matches(String normalizedType) {
            return matcher.test(normalizedType);
        }
    }

    private record NameRule(Predicate<String> matcher, String sampleValue) {
        private boolean matches(String normalizedName) {
            return matcher.test(normalizedName);
        }
    }
}


