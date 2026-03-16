package com.nimbly.mcpjavadevtools.examples.requestmapping.exampleframework.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExampleGet {
    String path() default "";
    String value() default "";
}
