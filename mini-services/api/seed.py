"""
Seed script — populates the FastAPI DB with real content.

Run: python3 seed.py

Seeds:
  - Subjects (6 academic + the framework for custom tracks)
  - Chapters (8-12 per subject, real titles)
  - Videos (5 per chapter)
  - Tests (30+ per subject mix)
  - Questions (5 per test, with options + explanations)
  - Leaderboard entries (100 mock learners + the user)
  - Live sessions (5)
  - Achievements (12)

The content covers the default science track (Physics/Chemistry/Maths/Biology/CS/English).
For custom tracks (Software Developer, Designer, etc.), the content-generator on the
client side fills in — the DB seeds the "default" catalog.
"""
import sys, os, json, uuid, random
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import engine, SessionLocal, Base
from models import (
    Subject, Chapter, Video, Test, Question,
    LeaderboardEntry, LiveSession, Achievement,
    User, UserSettings, UserAppearance,
)

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing content (keep users + their data)
for model in [Subject, Chapter, Video, Test, Question, LeaderboardEntry, LiveSession, Achievement]:
    db.query(model).delete()
db.commit()

random.seed(42)

# --- Subjects ---
subjects_data = [
    {"id": "physics", "name": "Physics", "icon": "Atom", "color": "oklch(0.74 0.135 62)"},
    {"id": "chemistry", "name": "Chemistry", "icon": "FlaskConical", "color": "oklch(0.7 0.13 150)"},
    {"id": "maths", "name": "Maths", "icon": "Sigma", "color": "oklch(0.72 0.1 250)"},
    {"id": "biology", "name": "Biology", "icon": "Dna", "color": "oklch(0.7 0.13 30)"},
    {"id": "cs", "name": "Computer Science", "icon": "Cpu", "color": "oklch(0.75 0.09 200)"},
    {"id": "english", "name": "English", "icon": "BookOpen", "color": "oklch(0.78 0.05 90)"},
]

chapter_titles = {
    "physics": ["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power",
                "Rotational Dynamics", "Gravitation", "Thermodynamics", "Oscillations & Waves",
                "Electrostatics", "Current Electricity", "Magnetism", "Modern Physics"],
    "chemistry": ["Mole Concept", "Atomic Structure", "Chemical Bonding", "Thermochemistry",
                  "Equilibrium", "Redox Reactions", "Periodic Table", "Coordination Compounds",
                  "Hydrocarbons", "Haloalkanes", "Aldehydes & Ketones", "Biomolecules"],
    "maths": ["Sets & Relations", "Complex Numbers", "Quadratic Equations", "Sequences & Series",
              "Permutations", "Binomial Theorem", "Matrices & Determinants", "Limits & Continuity",
              "Differentiation", "Integration", "Differential Equations", "Vectors & 3D Geometry"],
    "biology": ["Cell Biology", "Biomolecules", "Plant Physiology", "Human Physiology",
                "Reproduction", "Genetics", "Evolution", "Biotechnology",
                "Ecology", "Microbiology", "Anatomy", "Molecular Biology"],
    "cs": ["Programming Basics", "Data Types", "Control Flow", "Functions",
           "Arrays & Strings", "OOP Concepts", "Recursion", "Data Structures",
           "Algorithms", "Databases", "Networking", "Operating Systems"],
    "english": ["Reading Comprehension", "Grammar Essentials", "Vocabulary", "Sentence Correction",
                "Para Jumbles", "Critical Reasoning", "Verbal Analogies", "Idioms & Phrases",
                "Precis Writing", "Essay Structure", "Error Spotting", "Cloze Test"],
}

video_topics = ["Introduction & Fundamentals", "Core Concepts", "Solved Examples",
                "Advanced Problems", "Quick Revision"]
instructors = ["NV Sir", "AS Mam", "GB Sir", "MC Sir", "RK Mam", "JP Sir"]

for s_data in subjects_data:
    subject = Subject(**s_data)
    db.add(subject)
    db.flush()

    for ci, title in enumerate(chapter_titles.get(subject.id, [])):
        chapter = Chapter(
            id=f"{subject.id}-c{ci+1}",
            subject_id=subject.id,
            number=ci+1,
            title=title,
            topic_count=5,
            duration_min=random.randint(95, 220),
        )
        db.add(chapter)
        db.flush()

        for vi in range(5):
            video = Video(
                id=f"{chapter.id}-v{vi+1}",
                chapter_id=chapter.id,
                subject_id=subject.id,
                number=vi+1,
                title=f"{title}: {video_topics[vi]}",
                instructor=random.choice(instructors),
                duration_sec=random.randint(18, 62) * 60,
            )
            db.add(video)

db.commit()
print(f"✓ Seeded {len(subjects_data)} subjects, chapters, and videos")

# --- Tests ---
test_types = ["Full Syllabus", "Chapter Test", "Previous Year", "Mock Test", "Quiz"]
difficulties = ["Easy", "Moderate", "Hard"]
subject_names = [s["name"] for s in subjects_data]

for i in range(54):
    t_type = test_types[i % len(test_types)]
    subject = random.choice(subject_names)
    test = Test(
        id=f"test-{i+1}",
        name=f"{t_type} {str(i+1).zfill(2)} — {subject}",
        type=t_type,
        subject=subject,
        question_count=random.randint(20, 60),
        duration_min=random.randint(30, 180),
        deadline_hours=random.choice([None, random.randint(2, 96)]),
        difficulty=random.choice(difficulties),
    )
    db.add(test)
    db.flush()

    # 5 questions per test
    for qi in range(5):
        correct_idx = random.randint(0, 3)
        q = Question(
            id=f"{test.id}-q{qi+1}",
            test_id=test.id,
            text=f"Question {qi+1}: Which of the following is correct regarding {subject} concept {qi+1}?",
            options=[f"Option A", f"Option B", f"Option C", f"Option D"],
            correct_index=correct_idx,
            explanation=f"The correct answer is Option {chr(65 + correct_idx)}. This is because the fundamental principle states that the relationship holds under standard conditions.",
            subject=subject,
        )
        db.add(q)

db.commit()
print(f"✓ Seeded 54 tests with questions")

# --- Leaderboard ---
first_names = ["Aarav", "Vivaan", "Reyansh", "Ananya", "Diya", "Kabir", "Ira", "Arjun",
               "Saanvi", "Aditya", "Riya", "Rohan", "Myra", "Veer", "Anika", "Arnav",
               "Priya", "Karan", "Neha", "Dhruv"]
last_names = ["Sharma", "Verma", "Patel", "Gupta", "Reddy", "Nair", "Kapoor", "Mehta",
              "Bose", "Iyer", "Singh", "Jain", "Rao", "Chopra", "Malhotra"]
batches = ["Nucleus 2026", "Zenith 2026", "Apex 2027", "Pinnacle 2027"]

entries = []
for i in range(100):
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    score = max(500, 3000 - i * random.randint(15, 35) + random.randint(-20, 20))
    entries.append(LeaderboardEntry(
        id=f"lb-{i+1}",
        user_id=None,
        name=name,
        score=score,
        streak=random.randint(1, 45),
        change=random.randint(-5, 8),
        batch=random.choice(batches),
        rank=i+1,
    ))

# Insert "you" at rank 47
you_entry = entries[46]
you_entry.name = "You"
you_entry.score = 2855
you_entry.streak = 23
you_entry.change = 3
you_entry.batch = "Nucleus 2026"

for e in entries:
    db.add(e)
db.commit()
print(f"✓ Seeded 100 leaderboard entries")

# --- Live sessions ---
live_data = [
    {"subject": "Physics", "topic": "Rotational Dynamics — Torque & Angular Momentum", "instructor": "NV Sir", "viewers": 1240, "is_live": True},
    {"subject": "Chemistry", "topic": "Chemical Equilibrium — Le Chatelier", "instructor": "AS Mam", "viewers": 0, "is_live": False},
    {"subject": "Maths", "topic": "Definite Integration Marathon", "instructor": "GB Sir", "viewers": 0, "is_live": False},
    {"subject": "Physics", "topic": "Modern Physics — Photoelectric Effect", "instructor": "MC Sir", "viewers": 0, "is_live": False},
    {"subject": "Maths", "topic": "Probability Crash Course", "instructor": "RK Mam", "viewers": 0, "is_live": False},
]
for i, ld in enumerate(live_data):
    db.add(LiveSession(id=f"live-{i+1}", **ld))
db.commit()
print(f"✓ Seeded 5 live sessions")

# --- Achievements ---
ach_data = [
    {"title": "First Steps", "description": "Complete your first lesson", "category": "Study Streak", "rarity": "Common", "icon": "Sparkles", "earned": True, "earned_at": "2026-06-15", "progress": 1.0},
    {"title": "Week Warrior", "description": "Maintain a 7-day streak", "category": "Study Streak", "rarity": "Common", "icon": "Flame", "earned": True, "earned_at": "2026-06-18", "progress": 1.0},
    {"title": "Month Master", "description": "Maintain a 30-day streak", "category": "Study Streak", "rarity": "Rare", "icon": "Trophy", "earned": False, "earned_at": None, "progress": 0.77},
    {"title": "Test Taker", "description": "Complete 10 tests", "category": "Test Mastery", "rarity": "Common", "icon": "FileText", "earned": False, "earned_at": None, "progress": 0.6},
    {"title": "Top Scorer", "description": "Score 90%+ on a test", "category": "Test Mastery", "rarity": "Rare", "icon": "Target", "earned": False, "earned_at": None, "progress": 0.3},
    {"title": "Subject Expert", "description": "Master a subject completely", "category": "Subject Expert", "rarity": "Epic", "icon": "Award", "earned": False, "earned_at": None, "progress": 0.5},
    {"title": "Doubt Destroyer", "description": "Resolve 100 doubts", "category": "Special", "rarity": "Rare", "icon": "MessageCircleQuestion", "earned": False, "earned_at": None, "progress": 0.66},
    {"title": "Night Owl", "description": "Study after 10 PM 5 times", "category": "Special", "rarity": "Common", "icon": "Moon", "earned": False, "earned_at": None, "progress": 0.8},
    {"title": "Early Bird", "description": "Study before 7 AM 5 times", "category": "Special", "rarity": "Common", "icon": "Sunrise", "earned": False, "earned_at": None, "progress": 0.4},
    {"title": "Consistency King", "description": "100-day streak", "category": "Study Streak", "rarity": "Legendary", "icon": "Crown", "earned": False, "earned_at": None, "progress": 0.23},
    {"title": "Scholar", "description": "Complete 50 chapters", "category": "Subject Expert", "rarity": "Epic", "icon": "Sigma", "earned": False, "earned_at": None, "progress": 0.65},
    {"title": "Marathon Runner", "description": "Study 6+ hours in one day", "category": "Study Streak", "rarity": "Rare", "icon": "Zap", "earned": False, "earned_at": None, "progress": 0.9},
    {"title": "Speed Demon", "description": "Finish a test in half the time", "category": "Test Mastery", "rarity": "Rare", "icon": "Zap", "earned": False, "earned_at": None, "progress": 0.0},
    {"title": "Perfectionist", "description": "Score 100% on any test", "category": "Test Mastery", "rarity": "Epic", "icon": "Star", "earned": False, "earned_at": None, "progress": 0.0},
    {"title": "Helping Hand", "description": "Answer 50 doubts from others", "category": "Special", "rarity": "Rare", "icon": "Heart", "earned": False, "earned_at": None, "progress": 0.1},
    {"title": "Delta Legend", "description": "Unlock all other achievements", "category": "Special", "rarity": "Legendary", "icon": "Crown", "earned": False, "earned_at": None, "progress": 0.15},
]
for i, ad in enumerate(ach_data):
    db.add(Achievement(id=f"ach-{i+1}", **ad))
db.commit()
print(f"✓ Seeded {len(ach_data)} achievements")

# --- Summary ---
print(f"\n=== Seed complete ===")
print(f"  Subjects: {db.query(Subject).count()}")
print(f"  Chapters: {db.query(Chapter).count()}")
print(f"  Videos: {db.query(Video).count()}")
print(f"  Tests: {db.query(Test).count()}")
print(f"  Questions: {db.query(Question).count()}")
print(f"  Leaderboard: {db.query(LeaderboardEntry).count()}")
print(f"  Live sessions: {db.query(LiveSession).count()}")
print(f"  Achievements: {db.query(Achievement).count()}")
print(f"  Users: {db.query(User).count()}")

db.close()
