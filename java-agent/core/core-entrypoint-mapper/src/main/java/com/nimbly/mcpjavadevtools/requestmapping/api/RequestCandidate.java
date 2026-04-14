package com.nimbly.mcpjavadevtools.requestmapping.api;

import java.util.List;

public final class RequestCandidate {
    public String method;
    public String path;
    public String queryTemplate;
    public String fullUrlHint;
    public String bodyTemplate;
    public List<String> assumptions;
    public List<String> needsConfirmation;
    public List<String> rationale;
}


