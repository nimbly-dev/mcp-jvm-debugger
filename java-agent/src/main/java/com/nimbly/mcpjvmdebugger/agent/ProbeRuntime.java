package com.nimbly.mcpjvmdebugger.agent;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public final class ProbeRuntime {
  private static final ConcurrentHashMap<String, AtomicLong> COUNTS = new ConcurrentHashMap<>();
  private static final ConcurrentHashMap<String, AtomicLong> LAST_HIT_EPOCH_MS = new ConcurrentHashMap<>();
  private static volatile String MODE = "observe";
  private static volatile String ACTUATOR_ID = "";
  private static volatile String ACTUATE_TARGET_KEY = "";
  private static volatile boolean ACTUATE_RETURN_BOOLEAN = false;

  static void configure(
      String mode,
      String actuatorId,
      String actuateTargetKey,
      boolean actuateReturnBoolean
  ) {
    String m = (mode == null || mode.isBlank()) ? "observe" : mode.trim().toLowerCase();
    if (!"actuate".equals(m)) {
      MODE = "observe";
      ACTUATOR_ID = "";
      ACTUATE_TARGET_KEY = "";
      ACTUATE_RETURN_BOOLEAN = false;
      return;
    }

    MODE = "actuate";
    ACTUATOR_ID = (actuatorId == null) ? "" : actuatorId.trim();
    ACTUATE_TARGET_KEY = (actuateTargetKey == null) ? "" : actuateTargetKey.trim();
    ACTUATE_RETURN_BOOLEAN = actuateReturnBoolean;
  }

  public static void hit(String key) {
    if (key == null || key.isEmpty()) return;
    COUNTS.computeIfAbsent(key, k -> new AtomicLong()).incrementAndGet();
    LAST_HIT_EPOCH_MS.computeIfAbsent(key, k -> new AtomicLong()).set(System.currentTimeMillis());
  }

  public static void hitByClassMethod(String dottedClassName, String methodName) {
    if (dottedClassName == null || methodName == null) return;
    hit(dottedClassName + "#" + methodName);
  }

  static long getCount(String key) {
    AtomicLong v = COUNTS.get(key);
    return v == null ? 0L : v.get();
  }

  static long getLastHitEpochMs(String key) {
    AtomicLong v = LAST_HIT_EPOCH_MS.get(key);
    return v == null ? 0L : v.get();
  }

  static String getMode() {
    return MODE;
  }

  static String getActuatorId() {
    return ACTUATOR_ID;
  }

  static String getActuateTargetKey() {
    return ACTUATE_TARGET_KEY;
  }

  public static boolean getActuateReturnBoolean() {
    return ACTUATE_RETURN_BOOLEAN;
  }

  public static boolean shouldActuateBooleanReturn(String dottedClassName, String methodName) {
    if (!"actuate".equals(MODE)) return false;
    if (ACTUATE_TARGET_KEY == null || ACTUATE_TARGET_KEY.isBlank()) return false;
    if (dottedClassName == null || dottedClassName.isBlank() || methodName == null || methodName.isBlank()) return false;
    String key = dottedClassName + "#" + methodName;
    return ACTUATE_TARGET_KEY.equals(key);
  }

  static void reset(String key) {
    if (key == null || key.isEmpty()) return;
    COUNTS.computeIfAbsent(key, k -> new AtomicLong()).set(0L);
    LAST_HIT_EPOCH_MS.computeIfAbsent(key, k -> new AtomicLong()).set(0L);
  }
}
