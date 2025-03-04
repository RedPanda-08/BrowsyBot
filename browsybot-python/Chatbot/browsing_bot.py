import sqlite3
from datetime import datetime
import json

class BrowsingHistoryBot:
    def __init__(self, db_name="browsing_history.db"):
        """Initialize the chatbot with a SQLite database"""
        self.conn = sqlite3.connect(db_name)
        self.create_tables()
    
    def create_tables(self):
        """Create necessary database tables"""
        cursor = self.conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS browsing_history (
            id INTEGER PRIMARY KEY,
            url TEXT NOT NULL,
            title TEXT,
            visit_time TIMESTAMP,
            notes TEXT,
            tags TEXT
        )
        ''')
        self.conn.commit()
    
    def add_entry(self, url, title=None, notes=None, tags=None):
        """Add a new browsing history entry"""
        cursor = self.conn.cursor()
        visit_time = datetime.now().isoformat()
        tags_json = json.dumps(tags) if tags else None
        
        cursor.execute('''
        INSERT INTO browsing_history (url, title, visit_time, notes, tags)
        VALUES (?, ?, ?, ?, ?)
        ''', (url, title, visit_time, notes, tags_json))
        self.conn.commit()
        return "Entry saved successfully!"
    
    def search_history(self, query):
        """Search through browsing history"""
        cursor = self.conn.cursor()
        cursor.execute('''
        SELECT * FROM browsing_history 
        WHERE url LIKE ? OR title LIKE ? OR notes LIKE ?
        ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
        results = cursor.fetchall()
        return results
    
    def get_entries_by_tag(self, tag):
        """Retrieve entries with specific tag"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM browsing_history WHERE tags LIKE ?', (f'%{tag}%',))
        return cursor.fetchall()
    
    def add_notes_to_entry(self, entry_id, notes):
        """Add or update notes for a specific entry"""
        cursor = self.conn.cursor()
        cursor.execute('''
        UPDATE browsing_history 
        SET notes = ?
        WHERE id = ?
        ''', (notes, entry_id))
        self.conn.commit()
        return "Notes updated successfully!"
    
    def chat(self, user_input):
        """Simple chat interface to interact with the history"""
        if user_input.lower().startswith('save '):
            # Format: save url|title|notes|tag1,tag2
            parts = user_input[5:].split('|')
            url = parts[0].strip()
            title = parts[1].strip() if len(parts) > 1 else None
            notes = parts[2].strip() if len(parts) > 2 else None
            tags = parts[3].strip().split(',') if len(parts) > 3 else None
            return self.add_entry(url, title, notes, tags)
            
        elif user_input.lower().startswith('search '):
            query = user_input[7:].strip()
            results = self.search_history(query)
            return self.format_results(results)
            
        elif user_input.lower().startswith('tag '):
            tag = user_input[4:].strip()
            results = self.get_entries_by_tag(tag)
            return self.format_results(results)
            
        else:
            return "Commands available:\n- save url|title|notes|tags\n- search query\n- tag tagname"
    
    def format_results(self, results):
        """Format search results for display"""
        if not results:
            return "No results found."
        
        output = []
        for row in results:
            entry = f"ID: {row[0]}\nURL: {row[1]}\nTitle: {row[2]}\n"
            entry += f"Visit Time: {row[3]}\nNotes: {row[4]}\nTags: {row[5]}\n"
            output.append(entry)
        
        return "\n".join(output)

    def close(self):
        """Close the database connection"""
        self.conn.close()