"""Build a signed offline APK using official SDK tools and JDK 17, without downloads."""
import argparse
import hashlib
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import uuid
import zipfile

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--build-tools', type=Path, required=True)
parser.add_argument('--android-jar', type=Path, required=True)
parser.add_argument('--jdk', type=Path, required=True)
parser.add_argument('--signing-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
sdk, jar, jdk = args.build_tools.resolve(), args.android_jar.resolve(), args.jdk.resolve()
signing, output = args.signing_dir.resolve(), args.output.resolve()
if signing == ROOT or ROOT in signing.parents:
    raise SystemExit('Signing material must be outside the repository.')
for required in [sdk/'aapt2.exe', sdk/'lib/d8.jar', sdk/'lib/apksigner.jar', jar, jdk/'bin/java.exe', jdk/'bin/javac.exe']:
    if not required.is_file(): raise SystemExit(f'Missing tool: {required}')

def run(*command):
    subprocess.run([str(part) for part in command], check=True)

build = ROOT / 'android/.build' / uuid.uuid4().hex
for folder in ['assets/www', 'gen', 'classes', 'dex']:
    (build/folder).mkdir(parents=True, exist_ok=True)
for asset in (ROOT/'dist').iterdir():
    if asset.is_file() and asset.name != 'sw.js': shutil.copy2(asset, build/'assets/www'/asset.name)
run(sdk/'aapt2.exe', 'compile', '--dir', ROOT/'android/res', '-o', build/'resources.zip')
run(sdk/'aapt2.exe', 'link', '-I', jar, '--manifest', ROOT/'android/AndroidManifest.xml',
    '--java', build/'gen', '-A', build/'assets', '-o', build/'unsigned.apk', build/'resources.zip')
sources = sorted((ROOT/'android/src').rglob('*.java')) + sorted((build/'gen').rglob('*.java'))
run(jdk/'bin/javac.exe', '-encoding', 'UTF-8', '--release', '8', '-classpath', jar, '-d', build/'classes', *sources)
with zipfile.ZipFile(build/'classes.jar', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted((build/'classes').rglob('*.class')): archive.write(file, file.relative_to(build/'classes').as_posix())
run(jdk/'bin/java.exe', '-cp', sdk/'lib/d8.jar', 'com.android.tools.r8.D8', '--release', '--min-api', '26', '--lib', jar, '--output', build/'dex', build/'classes.jar')
with zipfile.ZipFile(build/'unsigned.apk') as resources, zipfile.ZipFile(build/'combined.apk', 'w', zipfile.ZIP_DEFLATED) as archive:
    for entry in resources.infolist(): archive.writestr(entry.filename, resources.read(entry.filename), compress_type=entry.compress_type)
    for file in sorted((build/'dex').glob('*.dex')): archive.write(file, file.name)
run(sdk/'zipalign.exe', '-p', '-f', '4', build/'combined.apk', build/'aligned.apk')

signing.mkdir(parents=True, exist_ok=True)
keystore, password = signing/'abhyas-release.p12', signing/'keystore-password.txt'
if not keystore.exists():
    if password.exists(): raise SystemExit('A password exists without its key. Recover the key before continuing.')
    password.write_text(secrets.token_urlsafe(48), encoding='utf-8')
    os.chmod(password, 0o600)
    run(jdk/'bin/keytool.exe', '-genkeypair', '-keystore', keystore, '-storetype', 'PKCS12', '-alias', 'abhyas-release',
        '-storepass:file', password, '-keypass:file', password, '-keyalg', 'RSA', '-keysize', '4096',
        '-validity', '10000', '-dname', 'CN=Abhyas, OU=Android, O=Abhyas, C=IN')
    os.chmod(keystore, 0o600)
if not password.is_file(): raise SystemExit('The existing release key requires its saved password file.')
output.parent.mkdir(parents=True, exist_ok=True)
run(jdk/'bin/java.exe', '-jar', sdk/'lib/apksigner.jar', 'sign', '--ks', keystore, '--ks-key-alias', 'abhyas-release',
    '--ks-pass', 'file:'+str(password), '--out', output, build/'aligned.apk')
run(jdk/'bin/java.exe', '-jar', sdk/'lib/apksigner.jar', 'verify', '--verbose', '--print-certs', output)
run(sdk/'zipalign.exe', '-c', '4', output)
run(sdk/'aapt2.exe', 'dump', 'badging', output)
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.apk.sha256').write_text(f'{digest}  {output.name}\n', encoding='utf-8')
print(f'APK: {output}\nSHA-256: {digest}')
