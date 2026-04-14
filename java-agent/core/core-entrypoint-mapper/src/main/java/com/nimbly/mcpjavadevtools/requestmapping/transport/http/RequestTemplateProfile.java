package com.nimbly.mcpjavadevtools.requestmapping.transport.http;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;

public final class RequestTemplateProfile {
    private static final RequestTemplateProfile DEFAULT_PROFILE = new RequestTemplateProfile(
            "(built-in-defaults)",
            RequestTemplateProfileConstants.DEFAULT_QUERY_SAMPLE,
            RequestTemplateProfileConstants.DEFAULT_BODY_SAMPLE,
            Map.of(),
            Map.of(),
            Map.of()
    );

    private final String source;
    private final String defaultQuerySample;
    private final String defaultBodySample;
    private final Map<String, String> querySamplesByParam;
    private final Map<String, String> pathSamplesByParam;
    private final Map<String, String> bodySamplesByParam;

    private RequestTemplateProfile(
            String source,
            String defaultQuerySample,
            String defaultBodySample,
            Map<String, String> querySamplesByParam,
            Map<String, String> pathSamplesByParam,
            Map<String, String> bodySamplesByParam
    ) {
        this.source = source;
        this.defaultQuerySample = defaultQuerySample;
        this.defaultBodySample = defaultBodySample;
        this.querySamplesByParam = Map.copyOf(querySamplesByParam);
        this.pathSamplesByParam = Map.copyOf(pathSamplesByParam);
        this.bodySamplesByParam = Map.copyOf(bodySamplesByParam);
    }

    public static RequestTemplateProfile defaults() {
        return DEFAULT_PROFILE;
    }

    public static RequestTemplateProfile load(Path projectRoot) {
        Path profilePath = resolveProfilePath(projectRoot);
        if (profilePath == null || !Files.isRegularFile(profilePath)) {
            return DEFAULT_PROFILE;
        }

        Properties properties = new Properties();
        try (Reader reader = Files.newBufferedReader(profilePath, StandardCharsets.UTF_8)) {
            properties.load(reader);
        } catch (IOException ignored) {
            return DEFAULT_PROFILE;
        }

        String configuredQueryDefault =
                trimToNull(properties.getProperty(RequestTemplateProfileConstants.QUERY_DEFAULT_KEY));
        String configuredBodyDefault =
                trimToNull(properties.getProperty(RequestTemplateProfileConstants.BODY_DEFAULT_KEY));
        String defaultQuerySample = configuredQueryDefault != null
                ? configuredQueryDefault
                : RequestTemplateProfileConstants.DEFAULT_QUERY_SAMPLE;
        String defaultBodySample = configuredBodyDefault != null
                ? configuredBodyDefault
                : RequestTemplateProfileConstants.DEFAULT_BODY_SAMPLE;
        Map<String, String> queryByParam = new HashMap<>();
        Map<String, String> pathByParam = new HashMap<>();
        Map<String, String> bodyByParam = new HashMap<>();

        for (String key : properties.stringPropertyNames()) {
            String value = trimToNull(properties.getProperty(key));
            if (value == null) {
                continue;
            }
            String normalizedKey = key.trim();
            if (normalizedKey.startsWith(RequestTemplateProfileConstants.QUERY_PARAM_PREFIX)) {
                putParamOverride(
                        queryByParam,
                        normalizedKey,
                        RequestTemplateProfileConstants.QUERY_PARAM_PREFIX,
                        value
                );
                continue;
            }
            if (normalizedKey.startsWith(RequestTemplateProfileConstants.PATH_PARAM_PREFIX)) {
                putParamOverride(
                        pathByParam,
                        normalizedKey,
                        RequestTemplateProfileConstants.PATH_PARAM_PREFIX,
                        value
                );
                continue;
            }
            if (normalizedKey.startsWith(RequestTemplateProfileConstants.BODY_PARAM_PREFIX)) {
                putParamOverride(
                        bodyByParam,
                        normalizedKey,
                        RequestTemplateProfileConstants.BODY_PARAM_PREFIX,
                        value
                );
            }
        }

        return new RequestTemplateProfile(
                profilePath.toString(),
                defaultQuerySample,
                defaultBodySample,
                queryByParam,
                pathByParam,
                bodyByParam
        );
    }

    private static void putParamOverride(
            Map<String, String> out,
            String rawKey,
            String prefix,
            String value
    ) {
        String name = rawKey.substring(prefix.length()).trim().toLowerCase(Locale.ROOT);
        if (!name.isEmpty()) {
            out.put(name, value);
        }
    }

    private static Path resolveProfilePath(Path projectRoot) {
        String configured = trimToNull(System.getenv(RequestTemplateProfileConstants.PROFILE_PATH_ENV));
        if (configured != null) {
            Path configuredPath = Path.of(configured);
            if (configuredPath.isAbsolute()) {
                return configuredPath.normalize();
            }
            if (projectRoot != null) {
                return projectRoot.resolve(configuredPath).normalize();
            }
            return configuredPath.normalize();
        }
        if (projectRoot == null) {
            return null;
        }
        return projectRoot.resolve(RequestTemplateProfileConstants.PROFILE_RELATIVE_PATH).normalize();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public String source() {
        return source;
    }

    public String defaultQuerySample() {
        return defaultQuerySample;
    }

    public String defaultBodySample() {
        return defaultBodySample;
    }

    public String querySampleForParam(String paramName) {
        return sampleForParam(querySamplesByParam, paramName);
    }

    public String pathSampleForParam(String paramName) {
        return sampleForParam(pathSamplesByParam, paramName);
    }

    public String bodySampleForParam(String paramName) {
        return sampleForParam(bodySamplesByParam, paramName);
    }

    private static String sampleForParam(Map<String, String> byParam, String paramName) {
        String normalized = paramName == null ? "" : paramName.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return null;
        }
        return byParam.get(normalized);
    }
}
