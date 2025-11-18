@@ +66,6 +66,18 @@
       }
     ) as unknown as BigIntConstructor;
   }
+
+// Wagmi polyfills for global
+(globalThis as any).global = globalThis;
+
+// Additional Web3 polyfills
+if (typeof globalThis.process === 'undefined') {
+  globalThis.process = process;
+}
+
+if (typeof globalThis.Buffer === 'undefined') {
+  globalThis.Buffer = Buffer;
+}
+
 export default {};