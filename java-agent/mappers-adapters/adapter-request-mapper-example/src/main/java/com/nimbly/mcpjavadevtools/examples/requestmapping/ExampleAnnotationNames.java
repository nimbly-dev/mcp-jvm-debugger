package com.nimbly.mcpjavadevtools.examples.requestmapping;

import java.util.Map;

public final class ExampleAnnotationNames {
    private ExampleAnnotationNames() {
    }

    public static final String EXAMPLE_CONTROLLER = "ExampleController";
    public static final String EXAMPLE_ROUTE = "ExampleRoute";
    public static final Map<String, String> COMPOSED_MAPPINGS = Map.of(
            "ExampleGet", "GET",
            "ExamplePost", "POST",
            "ExamplePut", "PUT",
            "ExamplePatch", "PATCH",
            "ExampleDelete", "DELETE"
    );

    public static String simpleName(String rawName) {
        int idx = rawName.lastIndexOf('.');
        return idx >= 0 ? rawName.substring(idx + 1) : rawName;
    }
}
