import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoku_project.settings')
django.setup()

from django.test import Client

def test_hint():
    c = Client()
    # 1. Start new game
    response = c.get('/new-game/?difficulty=easy')
    if response.status_code != 200:
        print("Failed to start new game")
        return
    
    data = json.loads(response.content)
    if not data['success']:
        print("New game success=False")
        return
    
    puzzle = data['puzzle']
    print("Game started. Puzzle received.")
    
    # 2. Request hint
    # We need to send grid. Let's just send the puzzle as is (all correct or 0)
    # Pick a cell that is 0
    row, col = -1, -1
    for r in range(9):
        for c in range(9):
            if puzzle[r][c] == 0:
                row, col = r, c
                break
        if row != -1: break
        
    print(f"Requesting hint for {row}, {col}")
    
    payload = {
        'grid': puzzle,
        'row': row,
        'col': col
    }
    
    response = c.post('/hint/', data=payload, content_type='application/json')
    print(f"Hint response status: {response.status_code}")
    print(f"Hint response body: {response.content.decode()}")

if __name__ == '__main__':
    test_hint()
