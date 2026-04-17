from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='c:/Users/Sooja/OneDrive/Desktop/acadmeic/archive_full/backend/.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'academic_crm')

client = MongoClient(mongo_url)
db = client[db_name]

# Fetch programs
programs = list(db.programs.find())
program_dict = {str(p['_id']): p.get('name', 'Unknown Program') for p in programs}

# Fetch subjects
subjects = list(db.subjects.find())

# Group subjects by program and semester
grouped = {}
for s in subjects:
    prog_id = str(s.get('program_id'))
    sem = s.get('semester', 1)
    
    if prog_id not in grouped:
        grouped[prog_id] = {}
        
    if sem not in grouped[prog_id]:
        grouped[prog_id][sem] = []
        
    grouped[prog_id][sem].append(s)

output_path = 'c:/Users/Sooja/OneDrive/Desktop/acadmeic/archive_full/subject.txt'

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(f"Total Subjects across all Courses: {len(subjects)}\n")
    f.write(f"Total Courses: {len(programs)}\n")
    f.write("="*50 + "\n\n")
    
    for prog_id, prog_name in program_dict.items():
        f.write(f"Course (Program): {prog_name}\n")
        f.write("-" * len(f"Course (Program): {prog_name}") + "\n")
        
        sems = grouped.get(prog_id, {})
        if not sems:
            f.write("  (No subjects mapped to this course yet)\n")
        else:
            for sem in sorted(sems.keys()):
                f.write(f"  Semester {sem}:\n")
                # Sort by core first, then elective
                sems[sem].sort(key=lambda x: (x.get('type', '').lower() != 'core', x.get('name', '')))
                
                for s in sems[sem]:
                    s_name = s.get('name', 'Unknown')
                    s_code = s.get('code', 'N/A')
                    s_type = s.get('type', 'Core')
                    s_cred = s.get('credits', 0)
                    f.write(f"    - [{s_code}] {s_name} ({s_type}, {s_cred} Credits)\n")
        f.write("\n")

print(f"Successfully exported {len(subjects)} subjects across {len(programs)} courses to {output_path}")
