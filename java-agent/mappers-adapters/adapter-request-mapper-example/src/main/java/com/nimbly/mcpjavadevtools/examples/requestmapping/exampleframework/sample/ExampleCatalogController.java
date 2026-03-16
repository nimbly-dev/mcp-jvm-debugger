package com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.sample;

import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.ExampleController;
import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.ExampleGet;
import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.ExamplePost;
import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.ExampleRoute;
import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.PathVariable;
import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.RequestBody;
import com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations.RequestParam;

@ExampleController(path = ExampleApiPaths.API_BASE)
public final class ExampleCatalogController {

    @ExampleGet(path = ExampleApiPaths.CATALOG + ExampleApiPaths.ITEM_PATH)
    public String getItem(
            @PathVariable("id") String id,
            @RequestParam("locale") String locale
    ) {
        return id + ":" + locale;
    }

    @ExamplePost(path = ExampleApiPaths.CATALOG)
    public String createItem(@RequestBody String payload) {
        return payload;
    }

    @ExampleRoute(method = "DELETE", path = ExampleApiPaths.CATALOG + ExampleApiPaths.ITEM_PATH)
    public void deleteItem(@PathVariable("id") String id) {
        // Example-only route.
    }
}
