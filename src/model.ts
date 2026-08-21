import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Module = require("./model/edge-impulse-standalone.js");

let initialized = false;

Module.onRuntimeInitialized = () => {
  initialized = true;
};

export async function initModel() {
  if (initialized) return;

  await new Promise<void>((resolve, reject) => {
    Module.onRuntimeInitialized = () => {
      initialized = true;

      const result = Module.init();

      if (typeof result === "number" && result !== 0) {
        reject(new Error(`Model init failed: ${result}`));
        return;
      }

      resolve();
    };
  });
}

export function classifyMotion(features: number[]) {
  if (!initialized) {
    throw new Error("Model is not initialized");
  }

  const typedArray = new Float32Array(features);
  const bytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
  const ptr = Module._malloc(bytes);

  const heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, bytes);
  heapBytes.set(new Uint8Array(typedArray.buffer));

  const result = Module.run_classifier(ptr, features.length, false);

  Module._free(ptr);

  if (result.result !== 0) {
    throw new Error(`Classification failed: ${result.result}`);
  }

  const outputs: { label: string; value: number }[] = [];

  for (let i = 0; i < result.size(); i++) {
    const item = result.get(i);
    outputs.push({
      label: item.label,
      value: item.value,
    });
    item.delete();
  }

  result.delete();

  outputs.sort((a, b) => b.value - a.value);

  return {
    motion: outputs[0].label,
    confidence: outputs[0].value,
    results: outputs,
  };
}