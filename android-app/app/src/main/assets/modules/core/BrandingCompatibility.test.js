import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

describe('Hardening - Branding & Compatibility Verification', () => {
  // 1. Application Title Branding in index.html
  it('1. standardizes application HTML title to Woobi', () => {
    const htmlPath = path.join(repoRoot, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('<title>Woobi | Good outfits. Already yours.</title>'));
  });

  // 2. Visible Brand Headers in index.html
  it('2. displays standardized Woobi brand marks on desktop and mobile studio headers', () => {
    const htmlPath = path.join(repoRoot, 'index.html');
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('<h1 class="desktop-brand-title">woobi</h1>'));
    assert.ok(content.includes('<span class="seren-brand-name">woobi</span>'));
    assert.ok(content.includes('<span class="seren-brand-sub">3D STUDIO</span>'));
  });

  // 3. Android Application Label Standardized to Woobi
  it('3. configures user-facing Android application label to Woobi', () => {
    const manifestPath = path.join(repoRoot, 'android-app/app/src/main/AndroidManifest.xml');
    const content = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(content.includes('android:label="Woobi"'));

    const stringsPath = path.join(repoRoot, 'android-app/app/src/main/res/values/strings.xml');
    const stringsContent = fs.readFileSync(stringsPath, 'utf8');
    assert.ok(stringsContent.includes('<string name="app_name">Woobi</string>'));
  });

  // 4. Critical Compatibility - Android Application ID / Namespace Preserved
  it('4. strictly preserves existing Android namespace and applicationId to avoid data loss', () => {
    const gradlePath = path.join(repoRoot, 'android-app/app/build.gradle.kts');
    const content = fs.readFileSync(gradlePath, 'utf8');
    assert.ok(content.includes('namespace = "com.example.aurawardrobe"'));
    assert.ok(content.includes('applicationId = "com.example.aurawardrobe"'));
  });

  // 5. Critical Compatibility - 3D GLB Asset Filenames Preserved
  it('5. strictly preserves tracked 3D asset filenames and paths without destructive renames', () => {
    const requiredAssets = [
      'seren_stage.glb',
      'wardrobe.glb',
      'seren_vanity.glb',
      'seren_avatar.glb'
    ];
    for (const asset of requiredAssets) {
      const fullPath = path.join(repoRoot, asset);
      assert.ok(fs.existsSync(fullPath), `Asset file ${asset} must exist intact`);
    }
  });

  // 6. Critical Compatibility - Package.json Product Metadata
  it('6. updates package.json with canonical product and organization metadata', () => {
    const pkgPath = path.join(repoRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.strictEqual(pkg.name, 'woobi');
    assert.strictEqual(pkg.author, 'Troyz Solutions');
    assert.ok(pkg.description.includes('Troyz Solutions'));
  });
});
