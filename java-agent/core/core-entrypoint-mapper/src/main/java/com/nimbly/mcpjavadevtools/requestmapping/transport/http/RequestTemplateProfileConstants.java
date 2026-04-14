package com.nimbly.mcpjavadevtools.requestmapping.transport.http;

public final class RequestTemplateProfileConstants {
    public static final String DEFAULT_QUERY_SAMPLE = "value";
    public static final String DEFAULT_BODY_SAMPLE = "{\"example\":\"value\"}";
    public static final String PROFILE_RELATIVE_PATH = ".mcp-java-dev-tools/request-template.properties";
    public static final String PROFILE_PATH_ENV = "MCP_REQUEST_TEMPLATE_PROFILE_PATH";
    public static final String QUERY_DEFAULT_KEY = "sample.query.default";
    public static final String BODY_DEFAULT_KEY = "sample.body.default";
    public static final String QUERY_PARAM_PREFIX = "sample.query.param.";
    public static final String PATH_PARAM_PREFIX = "sample.path.param.";
    public static final String BODY_PARAM_PREFIX = "sample.body.param.";

    private RequestTemplateProfileConstants() {
    }
}
