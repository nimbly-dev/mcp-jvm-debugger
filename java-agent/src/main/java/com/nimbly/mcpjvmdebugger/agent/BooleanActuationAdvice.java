package com.nimbly.mcpjvmdebugger.agent;

import net.bytebuddy.asm.Advice;

public final class BooleanActuationAdvice {
  private BooleanActuationAdvice() {}

  @Advice.OnMethodExit
  public static void onExit(
      @Advice.Origin("#t") String dottedClassName,
      @Advice.Origin("#m") String methodName,
      @Advice.Return(readOnly = false) boolean returnValue
  ) {
    if (!ProbeRuntime.shouldActuateBooleanReturn(dottedClassName, methodName)) {
      return;
    }
    returnValue = ProbeRuntime.getActuateReturnBoolean();
  }
}
