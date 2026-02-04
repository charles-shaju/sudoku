from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import random
from .sudoku_generator import SudokuGenerator

# Store puzzles in session
def index(request):
    """Main game page"""
    return render(request, 'game/index.html')

def new_game(request):
    """Generate a new Sudoku puzzle"""
    difficulty = request.GET.get('difficulty', 'medium')
    
    generator = SudokuGenerator()
    puzzle, solution = generator.generate_puzzle(difficulty)
    
    # Store solution in session
    request.session['solution'] = solution
    request.session['puzzle'] = puzzle
    request.session['hints_remaining'] = 3
    
    return JsonResponse({
        'puzzle': puzzle,
        'hints_remaining': 3,
        'success': True
    })


@csrf_exempt
def hint(request):
    """Return a hint (limited per game). Fills one non-prefilled cell with the correct value."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request'})

    solution = request.session.get('solution')
    puzzle = request.session.get('puzzle')
    if not solution or not puzzle:
        return JsonResponse({'success': False, 'error': 'No active game'})

    hints_remaining = int(request.session.get('hints_remaining', 0))
    if hints_remaining <= 0:
        return JsonResponse({'success': False, 'error': 'No hints left', 'remaining': 0})

    try:
        data = json.loads(request.body)
        user_grid = data.get('grid', [])
        requested_row = data.get('row')
        requested_col = data.get('col')

        def in_bounds(v):
            return isinstance(v, int) and 0 <= v < 9

        # If the client requests a specific cell, hint that cell when possible.
        if in_bounds(requested_row) and in_bounds(requested_col):
            row = requested_row
            col = requested_col

            # If user picked a prefilled cell, fall back to any eligible cell.
            if puzzle[row][col] == 0:
                correct = solution[row][col]
                current = user_grid[row][col]

                # If the selected cell is already correct, fall back to any eligible cell.
                if current != correct:
                    hints_remaining -= 1
                    request.session['hints_remaining'] = hints_remaining
                    return JsonResponse({'success': True, 'row': row, 'col': col, 'num': correct, 'remaining': hints_remaining})

        # Otherwise, pick a random incorrect non-prefilled cell.
        candidates = []
        for r in range(9):
            for c in range(9):
                if puzzle[r][c] != 0:
                    continue
                correct = solution[r][c]
                current = user_grid[r][c]
                if current != correct:
                    candidates.append((r, c, correct))

        if not candidates:
            return JsonResponse({'success': True, 'done': True, 'remaining': hints_remaining})

        row, col, num = random.choice(candidates)
        hints_remaining -= 1
        request.session['hints_remaining'] = hints_remaining

        return JsonResponse({'success': True, 'row': row, 'col': col, 'num': num, 'remaining': hints_remaining})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def check_solution(request):
    """Check if the submitted solution is correct"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_grid = data.get('grid', [])
            
            generator = SudokuGenerator()
            is_valid = generator.check_solution(user_grid)
            
            return JsonResponse({
                'valid': is_valid,
                'success': True
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def validate_move(request):
    """Validate a single move"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            grid = data.get('grid', [])
            row = data.get('row')
            col = data.get('col')
            num = data.get('num')
            
            generator = SudokuGenerator()
            is_valid = generator.is_valid(grid, row, col, num)
            
            return JsonResponse({
                'valid': is_valid,
                'success': True
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})
