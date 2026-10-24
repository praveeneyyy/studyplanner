import { LanguageDefinition, SupportedLanguage } from '../../types/ide';

export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageDefinition> = {
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    monacoLanguage: 'python',
    runtimeStatus: 'ready',
    runtimeLabel: 'Python 3.12 (Native)',
    starterCode: `# Student Python Workspace
# Write your algorithm or test cases below

def fibonacci(n: int) -> list[int]:
    """Generates the first n numbers in the Fibonacci sequence."""
    if n <= 0:
        return []
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

if __name__ == "__main__":
    count = 10
    result = fibonacci(count)
    print(f"Fibonacci({count}): {result}")
`
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    monacoLanguage: 'javascript',
    runtimeStatus: 'ready',
    runtimeLabel: 'Node.js (Native)',
    starterCode: `// Student JavaScript Workspace
// Modern ES6+ execution in Node.js

function findPrimes(limit) {
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}

const primesUpTo30 = findPrimes(30);
console.log("Prime numbers up to 30:", primesUpTo30);
`
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    monacoLanguage: 'typescript',
    runtimeStatus: 'ready',
    runtimeLabel: 'TypeScript / Node.js',
    starterCode: `// Student TypeScript Workspace
// Typed algorithms and data structures

interface StudentRecord {
  id: string;
  name: string;
  gpa: number;
}

function calculateHonorRoll(students: StudentRecord[], minGpa: number = 3.5): string[] {
  return students
    .filter(s => s.gpa >= minGpa)
    .map(s => s.name);
}

const scholars: StudentRecord[] = [
  { id: "S1", name: "Swetha", gpa: 3.95 },
  { id: "S2", name: "Prathima", gpa: 3.98 },
  { id: "S3", name: "Marcus Brody", gpa: 3.50 }
];

console.log("Honor Roll Students:", calculateHonorRoll(scholars));
`
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: '.java',
    monacoLanguage: 'java',
    runtimeStatus: 'ready',
    runtimeLabel: 'Java JDK (Native)',
    starterCode: `// Student Java Workspace
// Write any Java class with main(String[] args) (e.g. HelloWorld, Solution, Main)

import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("--- Binary Search in Java ---");
        int[] sortedArray = { 2, 5, 8, 12, 16, 23, 38, 56, 72, 91 };
        int target = 23;
        
        int index = binarySearch(sortedArray, target);
        System.out.printf("Element %d found at index: %d%n", target, index);
    }
    
    public static int binarySearch(int[] arr, int target) {
        int low = 0;
        int high = arr.length - 1;
        
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }
}
`
  },
  c: {
    id: 'c',
    name: 'C',
    extension: '.c',
    monacoLanguage: 'c',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'GCC / Clang',
    starterCode: `/* Student C Workspace */
#include <stdio.h>

int main() {
    printf("--- Pointers and Memory in C ---\\n");
    int value = 42;
    int *ptr = &value;
    
    printf("Value: %d\\n", value);
    printf("Memory Address: %p\\n", (void*)ptr);
    printf("Dereferenced value: %d\\n", *ptr);
    
    return 0;
}
`
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    monacoLanguage: 'cpp',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'G++ / Clang++',
    starterCode: `// Student C++ Workspace (STL & OOP)
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::cout << "--- Standard Template Library (vector) ---" << std::endl;
    std::vector<int> numbers = { 45, 12, 85, 32, 89, 39, 69, 44, 42, 1, 45, 8 };
    
    std::sort(numbers.begin(), numbers.end());
    
    std::cout << "Sorted elements: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
`
  },
  csharp: {
    id: 'csharp',
    name: 'C#',
    extension: '.cs',
    monacoLanguage: 'csharp',
    runtimeStatus: 'ready',
    runtimeLabel: '.NET SDK',
    starterCode: `// Student C# Workspace (.NET)
using System;
using System.Linq;

class Program {
    static void Main() {
        Console.WriteLine("--- LINQ Query in C# ---");
        int[] scores = { 97, 92, 81, 60, 88, 75 };
        
        var highScores = scores.Where(s => s >= 85).OrderByDescending(s => s);
        
        foreach (int score in highScores) {
            Console.WriteLine($"High Score: {score}");
        }
    }
}
`
  },
  go: {
    id: 'go',
    name: 'Go',
    extension: '.go',
    monacoLanguage: 'go',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'Go Compiler',
    starterCode: `// Student Go Workspace
package main

import (
	"fmt"
	"time"
)

func worker(id int, ch chan<- string) {
	time.Sleep(100 * time.Millisecond)
	ch <- fmt.Sprintf("Worker %d completed task", id)
}

func main() {
	ch := make(chan string)
	go worker(1, ch)
	go worker(2, ch)

	fmt.Println(<-ch)
	fmt.Println(<-ch)
}
`
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    extension: '.rs',
    monacoLanguage: 'rust',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'Rustc',
    starterCode: `// Student Rust Workspace
// Memory safety without garbage collection

fn main() {
    let mut message = String::from("Hello, Rustacean!");
    transform_string(&mut message);
    println!("{}", message);
}

fn transform_string(s: &mut String) {
    s.push_str(" Memory safely borrowed.");
}
`
  },
  php: {
    id: 'php',
    name: 'PHP',
    extension: '.php',
    monacoLanguage: 'php',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'PHP CLI',
    starterCode: `<?php
// Student PHP Workspace
$fruits = ["Apple", "Banana", "Cherry", "Date"];

echo "List of fruits:\n";
foreach ($fruits as $index => $fruit) {
    echo ($index + 1) . ". " . $fruit . "\n";
}
?>
`
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    extension: '.rb',
    monacoLanguage: 'ruby',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'Ruby Interpreter',
    starterCode: `# Student Ruby Workspace
def palindrome?(str)
  normalized = str.downcase.gsub(/[^a-z0-9]/, '')
  normalized == normalized.reverse
end

test_word = "A man a plan a canal Panama"
puts "#{test_word} is palindrome: #{palindrome?(test_word)}"
`
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    extension: '.kt',
    monacoLanguage: 'kotlin',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'Kotlinc / JVM',
    starterCode: `// Student Kotlin Workspace
fun main() {
    val items = listOf("Kotlin", "Java", "Python", "Rust")
    val upper = items.map { it.uppercase() }
    println("Languages: $upper")
}
`
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    extension: '.swift',
    monacoLanguage: 'swift',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'Swiftc',
    starterCode: `// Student Swift Workspace
import Foundation

struct Task {
    var title: String
    var isDone: Boolean
}

var task = Task(title: "Complete Spaced Repetition", isDone: false)
print("Active task: \\(task.title)")
`
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    extension: '.sql',
    monacoLanguage: 'sql',
    runtimeStatus: 'in-memory',
    runtimeLabel: 'SQLite (In-Memory Engine)',
    starterCode: `-- Student SQL Query Playground
-- Execute queries directly in SQLite

CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  major TEXT NOT NULL,
  gpa REAL DEFAULT 0.0
);

INSERT INTO students (name, major, gpa) VALUES
  ('Swetha', 'Computer Science', 3.95),
  ('Prathima', 'Information Technology', 3.98),
  ('Sophia Lin', 'Data Science', 3.92);

SELECT major, COUNT(*) AS student_count, ROUND(AVG(gpa), 2) AS avg_gpa
FROM students
GROUP BY major
ORDER BY avg_gpa DESC;
`
  },
  html: {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    monacoLanguage: 'html',
    runtimeStatus: 'browser',
    runtimeLabel: 'Web / DOM Renderer',
    starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Web Workspace</title>
  <style>
    body { font-family: sans-serif; padding: 24px; }
    .card { border: 1px solid #ccc; border-radius: 8px; padding: 16px; max-width: 400px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Interactive HTML Demo</h2>
    <p>Render markup and verify DOM structures in the browser preview.</p>
  </div>
</body>
</html>
`
  },
  css: {
    id: 'css',
    name: 'CSS',
    extension: '.css',
    monacoLanguage: 'css',
    runtimeStatus: 'browser',
    runtimeLabel: 'Web Stylesheet',
    starterCode: `/* Modern Responsive CSS Design */
:root {
  --primary-color: #2563eb;
  --bg-color: #ffffff;
  --text-color: #1e293b;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 2rem;
}
`
  },
  json: {
    id: 'json',
    name: 'JSON',
    extension: '.json',
    monacoLanguage: 'json',
    runtimeStatus: 'in-memory',
    runtimeLabel: 'JSON Schema Parser',
    starterCode: `{
  "projectName": "AI Smart Study IDE",
  "version": "1.0.0",
  "environment": "development",
  "activeStudent": {
    "name": "Swetha",
    "enrolledCourses": [
      "Operating Systems",
      "Data Structures & Algorithms",
      "Calculus"
    ],
    "settings": {
      "editorTheme": "vs-dark",
      "fontSize": 14,
      "wordWrap": true
    }
  }
}
`
  },
  bash: {
    id: 'bash',
    name: 'Bash',
    extension: '.sh',
    monacoLanguage: 'shell',
    runtimeStatus: 'compiler-needed',
    runtimeLabel: 'Bash / Shell',
    starterCode: `#!/usr/bin/env bash
# Student Shell Scripting Workspace

echo "--- System & Workspace Information ---"
echo "Current Date: $(date)"
echo "Current User: $USER"
echo "Available disk space in working directory:"
df -h . 2>/dev/null || echo "Shell ready"
`
  }
};
