#!/usr/bin/env bash
# Hoca'nın 5 senaryosu için test ZIP'leri oluşturan script
# Kullanım: bash generate_test_zips.sh
# Çıktı: ./test_submissions/ klasörü

set -e
OUT="./test_submissions"
mkdir -p "$OUT"

# ─── C TEST CASES ─────────────────────────────────────────────────────────────
# Config: compileCommand = "gcc", compileArgs = "-o {{outputName}} {{sourceFile}}"
#         runCommand = "./main", sourceFileExpected = "main.c"
# Input (text): "apple\nbanana\ncherry"
# Expected output: "apple\nbanana\ncherry\n"

## Senaryo 1: PASS — Derlenir, çalışır, çıktı eşleşir
mkdir -p /tmp/tc_c_pass/20230001
cat > /tmp/tc_c_pass/20230001/main.c << 'EOF'
#include <stdio.h>
int main(int argc, char *argv[]) {
    for (int i = 1; i < argc; i++) printf("%s\n", argv[i]);
    return 0;
}
EOF
cd /tmp/tc_c_pass && zip -r "$OLDPWD/$OUT/20230001.zip" 20230001 && cd -

## Senaryo 2: FAIL — Derlenir, çalışır, çıktı eşleşmez (ters sıra)
mkdir -p /tmp/tc_c_fail/20230002
cat > /tmp/tc_c_fail/20230002/main.c << 'EOF'
#include <stdio.h>
int main(int argc, char *argv[]) {
    for (int i = argc - 1; i >= 1; i--) printf("%s\n", argv[i]);
    return 0;
}
EOF
cd /tmp/tc_c_fail && zip -r "$OLDPWD/$OUT/20230002.zip" 20230002 && cd -

## Senaryo 3: RUNTIME_ERROR — Derlenir, çalışırken hata (null dereference)
mkdir -p /tmp/tc_c_runtime/20230003
cat > /tmp/tc_c_runtime/20230003/main.c << 'EOF'
#include <stdio.h>
int main(int argc, char *argv[]) {
    char *p = NULL;
    printf("%c\n", *p);   /* Segmentation fault */
    return 0;
}
EOF
cd /tmp/tc_c_runtime && zip -r "$OLDPWD/$OUT/20230003.zip" 20230003 && cd -

## Senaryo 4: COMPILE_ERROR — Derlenmez (syntax hatası)
mkdir -p /tmp/tc_c_compile_err/20230004
cat > /tmp/tc_c_compile_err/20230004/main.c << 'EOF'
#include <stdio.h>
int main(int argc char *argv[]) {  /* virgül eksik */
    printf("Hello\n")
    return 0
}
EOF
cd /tmp/tc_c_compile_err && zip -r "$OLDPWD/$OUT/20230004.zip" 20230004 && cd -

## Senaryo 5: MISSING_SOURCE — Kaynak dosya yok
mkdir -p /tmp/tc_c_missing/20230005
touch /tmp/tc_c_missing/20230005/readme.txt
cd /tmp/tc_c_missing && zip -r "$OLDPWD/$OUT/20230005.zip" 20230005 && cd -

# ─── PYTHON TEST CASES ────────────────────────────────────────────────────────
# Config: compileCommand = null (interpreted)
#         runCommand = "python3", runArgs = "{{sourceFile}} {{args}}"
#         sourceFileExpected = "main.py"
# Input (text): "apple\nbanana\ncherry"
# Expected output: "apple\nbanana\ncherry\n"

## Senaryo 1: PASS
mkdir -p /tmp/tc_py_pass/20230011
cat > /tmp/tc_py_pass/20230011/main.py << 'EOF'
import sys
for arg in sys.argv[1:]:
    print(arg)
EOF
cd /tmp/tc_py_pass && zip -r "$OLDPWD/$OUT/20230011.zip" 20230011 && cd -

## Senaryo 2: FAIL (yanlış çıktı)
mkdir -p /tmp/tc_py_fail/20230012
cat > /tmp/tc_py_fail/20230012/main.py << 'EOF'
import sys
for arg in reversed(sys.argv[1:]):
    print(arg)
EOF
cd /tmp/tc_py_fail && zip -r "$OLDPWD/$OUT/20230012.zip" 20230012 && cd -

## Senaryo 3: RUNTIME_ERROR (exception)
mkdir -p /tmp/tc_py_runtime/20230013
cat > /tmp/tc_py_runtime/20230013/main.py << 'EOF'
import sys
x = int(sys.argv[1])   # argv[1] string "apple" → ValueError
print(x)
EOF
cd /tmp/tc_py_runtime && zip -r "$OLDPWD/$OUT/20230013.zip" 20230013 && cd -

# ─── JAVA TEST CASES ──────────────────────────────────────────────────────────
# Config: compileCommand = "javac", compileArgs = "{{sourceFile}}"
#         runCommand = "java", runArgs = "Main {{args}}"
#         sourceFileExpected = "Main.java"

## Senaryo 1: PASS
mkdir -p /tmp/tc_java_pass/20230021
cat > /tmp/tc_java_pass/20230021/Main.java << 'EOF'
public class Main {
    public static void main(String[] args) {
        for (String arg : args) System.out.println(arg);
    }
}
EOF
cd /tmp/tc_java_pass && zip -r "$OLDPWD/$OUT/20230021.zip" 20230021 && cd -

## Senaryo 2: COMPILE_ERROR
mkdir -p /tmp/tc_java_compile/20230022
cat > /tmp/tc_java_compile/20230022/Main.java << 'EOF'
public class Main {
    public static void main(String[] args)  // parantez yok
        System.out.println("Hello")
    }
}
EOF
cd /tmp/tc_java_compile && zip -r "$OLDPWD/$OUT/20230022.zip" 20230022 && cd -

# ─── HASKELL TEST CASES ───────────────────────────────────────────────────────
# Config: compileCommand = "ghc", compileArgs = "-o {{outputName}} {{sourceFile}}"
#         runCommand = "./main", runArgs = "{{args}}"
#         sourceFileExpected = "Main.hs"

## Senaryo 1: PASS (functional paradigm)
mkdir -p /tmp/tc_hs_pass/20230031
cat > /tmp/tc_hs_pass/20230031/Main.hs << 'EOF'
import System.Environment (getArgs)
main :: IO ()
main = getArgs >>= mapM_ putStrLn
EOF
cd /tmp/tc_hs_pass && zip -r "$OLDPWD/$OUT/20230031.zip" 20230031 && cd -

## Senaryo 2: COMPILE_ERROR (tip hatası)
mkdir -p /tmp/tc_hs_compile/20230032
cat > /tmp/tc_hs_compile/20230032/Main.hs << 'EOF'
main :: IO ()
main = putStrLn 42   -- Int, String bekleniyordu
EOF
cd /tmp/tc_hs_compile && zip -r "$OLDPWD/$OUT/20230032.zip" 20230032 && cd -

# ─── ZIP ITSELF TEST CASES ────────────────────────────────────────────────────

## Geçersiz ZIP (bozuk dosya)
echo "Bu bir ZIP dosyası değil" > "$OUT/20230099.zip"

echo ""
echo "✅ Oluşturulan ZIP dosyaları: $OUT/"
ls -la "$OUT/"
