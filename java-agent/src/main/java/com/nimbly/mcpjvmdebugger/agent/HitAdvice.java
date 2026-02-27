package com.nimbly.mcpjvmdebugger.agent;

import net.bytebuddy.asm.Advice;

public final class HitAdvice {
  private HitAdvice() {}

  @Advice.OnMethodEnter
  public static void onEnter(
      @Advice.Origin("#t") String dottedClassName,
      @Advice.Origin("#m") String methodName
  ) {
    ProbeRuntime.hitByClassMethod(dottedClassName, methodName);
  }
}

