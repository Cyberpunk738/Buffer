const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { mkdtempSync, writeFileSync, symlinkSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const output = mkdtempSync(path.join(tmpdir(), "buffer-tests-"));
writeFileSync(path.join(output, "package.json"), '{"type":"commonjs"}');
symlinkSync(
  path.join(process.cwd(), "node_modules"),
  path.join(output, "node_modules"),
  "dir",
);
execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/engine/core/render.ts",
    "src/lib/export.ts",
    "src/lib/image-file.ts",
    "src/store/history.store.ts",
    "--outDir",
    output,
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--target",
    "es2022",
    "--skipLibCheck",
    "--esModuleInterop",
  ],
  { stdio: "pipe" },
);
after(() => rmSync(output, { recursive: true, force: true }));
const { getRenderPlan, renderImage } = require(
  path.join(output, "engine/core/render.js"),
);
const { exportFilename } = require(path.join(output, "lib/export.js"));
const { validateImageFile } = require(path.join(output, "lib/image-file.js"));
const { usePipelineStore: pipeline } = require(
  path.join(output, "store/pipeline.store.js"),
);
const { useHistoryStore: history } = require(
  path.join(output, "store/history.store.js"),
);
const { useProjectStore: project } = require(
  path.join(output, "store/project.store.js"),
);
const effect = (definitionType, parameters = {}) => ({
  data: { definitionType, parameters },
});
test("quarter-turn rotations swap bounds without losing image dimensions", () => {
  for (const angle of [90, 270, -90]) {
    const p = getRenderPlan(1200, 900, [effect("transform-rotate", { angle })]);
    assert.equal(p.width, 900);
    assert.equal(p.height, 1200);
  }
});
test("rotation draws around the output centre rather than clipping from its origin", () => {
  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    translate(...v) {
      calls.push(["translate", ...v]);
    },
    rotate() {},
    scale() {},
    drawImage(...v) {
      calls.push(["draw", ...v.slice(1)]);
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  renderImage(canvas, { width: 1200, height: 900 }, [
    effect("transform-rotate", { angle: 90 }),
  ]);
  assert.deepEqual(calls[0], ["translate", 450, 600]);
  assert.deepEqual(calls[1], ["draw", 0, 0, 1200, 900, -600, -450, 1200, 900]);
});
test("crop clamps to source bounds, including tiny images", () => {
  const p = getRenderPlan(10, 8, [
    effect("transform-crop", { x: 999, y: -5, width: 512, height: 512 }),
  ]);
  assert.deepEqual(
    [p.x, p.y, p.cropW, p.cropH, p.width, p.height],
    [9, 0, 1, 8, 1, 8],
  );
});
test("original preview and crop-edit geometry preserve the source, export applies edits", () => {
  const effects = [
    effect("transform-crop", { width: 600, height: 400 }),
    effect("transform-rotate", { angle: 90 }),
  ];
  assert.deepEqual(
    [
      getRenderPlan(1200, 900, effects, true).width,
      getRenderPlan(1200, 900, effects, true).height,
    ],
    [1200, 900],
  );
  assert.deepEqual(
    [
      getRenderPlan(1200, 900, effects, false, true).width,
      getRenderPlan(1200, 900, effects, false, true).height,
    ],
    [1200, 900],
  );
  assert.deepEqual(
    [
      getRenderPlan(1200, 900, effects).width,
      getRenderPlan(1200, 900, effects).height,
    ],
    [400, 600],
  );
});
test("unresized source retains its full resolution above 4096 pixels", () => {
  const p = getRenderPlan(5000, 3000, []);
  assert.equal(p.width, 5000);
  assert.equal(p.height, 3000);
});
test("flips toggle and opacity composes across effects", () => {
  const p = getRenderPlan(20, 20, [
    effect("transform-flip", { horizontal: true }),
    effect("transform-flip", { horizontal: true, vertical: true }),
    effect("composite-opacity", { opacity: 50 }),
    effect("composite-opacity", { opacity: 50 }),
  ]);
  assert.equal(p.flipH, false);
  assert.equal(p.flipV, true);
  assert.equal(p.opacity, 0.25);
});
test("exports clean unsafe names and avoid duplicate extensions", () => {
  assert.equal(exportFilename("my-photo.PNG", "image/jpeg"), "my-photo.jpg");
  assert.equal(exportFilename("", "image/png"), "buffer-image.png");
  assert.equal(exportFilename("../test", "image/webp"), "..-test.webp");
});
test("uploads reject unsupported, empty and oversized files", () => {
  assert.throws(() => validateImageFile({ type: "text/plain", size: 100 }));
  assert.throws(() => validateImageFile({ type: "image/png", size: 0 }));
  assert.throws(() =>
    validateImageFile({ type: "image/png", size: 26 * 1024 * 1024 }),
  );
  assert.doesNotThrow(() =>
    validateImageFile({ type: "image/webp", size: 100 }),
  );
});
const asset = {
  id: "sample",
  name: "Sample",
  type: "image/png",
  size: 100,
  width: 1200,
  height: 900,
  dataUrl: "data:",
  createdAt: 0,
};
function reset() {
  pipeline.getState().clearPipeline();
  history.getState().clearHistory();
  project.getState().setAssets([asset]);
  pipeline.getState().loadAssetAsInput(asset);
}
test("resize starts with source dimensions and maintains aspect ratio", () => {
  reset();
  const id = pipeline.getState().appendNodeToPipeline("transform-resize");
  pipeline.getState().updateNodeParameter(id, "width", 600);
  const n = pipeline.getState().nodes.find((n) => n.id === id);
  assert.equal(n.data.parameters.height, 450);
});
test("an edit immediately after undo clears redo and remains undoable", () => {
  reset();
  history.getState().pushSnapshot();
  pipeline.getState().appendNodeToPipeline("filter-blur");
  history.getState().undo();
  history.getState().pushSnapshot();
  pipeline.getState().appendNodeToPipeline("filter-invert");
  assert.equal(history.getState().canRedo(), false);
  history.getState().undo();
  assert.equal(pipeline.getState().nodes.length, 1);
});
test("undo restores removed image assets along with their input nodes", () => {
  reset();
  history.getState().pushSnapshot();
  pipeline.getState().clearPipeline();
  project.getState().removeAsset(asset.id);
  history.getState().undo();
  assert.equal(project.getState().assets[0].id, asset.id);
  assert.equal(pipeline.getState().getImageInputNode().data.assetId, asset.id);
});
