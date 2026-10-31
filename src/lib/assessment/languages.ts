// Languages offered in the coding round, with starter code that reads stdin.
// Shared by the browser (editor) and the server (compiler service).
export type CodeLanguage = 'python' | 'java' | 'c' | 'cpp' | 'csharp';

export const CODE_LANGUAGES: Array<{ id: CodeLanguage; label: string; fileName: string; starter: string }> = [
  {
    id: 'python',
    label: 'Python 3',
    fileName: 'main.py',
    starter: `import sys

def main():
    data = sys.stdin.read().split()
    # Write your solution here and print the answer.

main()
`,
  },
  {
    id: 'java',
    label: 'Java',
    fileName: 'Main.java',
    starter: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        // Write your solution here and print the answer.
    }
}
`,
  },
  {
    id: 'c',
    label: 'C',
    fileName: 'main.c',
    starter: `#include <stdio.h>

int main(void) {
    // Write your solution here and print the answer.
    return 0;
}
`,
  },
  {
    id: 'cpp',
    label: 'C++',
    fileName: 'main.cpp',
    starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Write your solution here and print the answer.
    return 0;
}
`,
  },
  {
    id: 'csharp',
    label: 'C#',
    fileName: 'Main.cs',
    starter: `using System;

class Program {
    static void Main() {
        // Write your solution here and print the answer.
    }
}
`,
  },
];

export const isCodeLanguage = (value: unknown): value is CodeLanguage =>
  CODE_LANGUAGES.some((language) => language.id === value);
