import random
import copy

class SudokuGenerator:
    """Generate and validate Sudoku puzzles"""
    
    def __init__(self):
        self.grid = [[0 for _ in range(9)] for _ in range(9)]
    
    def is_valid(self, grid, row, col, num):
        """Check if placing num at grid[row][col] is valid"""
        # Check row
        if num in grid[row]:
            return False
        
        # Check column
        if num in [grid[i][col] for i in range(9)]:
            return False
        
        # Check 3x3 box
        box_row, box_col = 3 * (row // 3), 3 * (col // 3)
        for i in range(box_row, box_row + 3):
            for j in range(box_col, box_col + 3):
                if grid[i][j] == num:
                    return False
        
        return True
    
    def solve(self, grid):
        """Solve Sudoku puzzle using backtracking"""
        for i in range(9):
            for j in range(9):
                if grid[i][j] == 0:
                    for num in range(1, 10):
                        if self.is_valid(grid, i, j, num):
                            grid[i][j] = num
                            if self.solve(grid):
                                return True
                            grid[i][j] = 0
                    return False
        return True
    
    def generate_complete_grid(self):
        """Generate a complete valid Sudoku grid"""
        grid = [[0 for _ in range(9)] for _ in range(9)]
        
        # Fill diagonal 3x3 boxes first (they're independent)
        for box in range(0, 9, 3):
            nums = list(range(1, 10))
            random.shuffle(nums)
            idx = 0
            for i in range(box, box + 3):
                for j in range(box, box + 3):
                    grid[i][j] = nums[idx]
                    idx += 1
        
        # Solve the rest
        self.solve(grid)
        return grid
    
    def remove_numbers(self, grid, difficulty='medium'):
        """Remove numbers from grid to create puzzle"""
        # Difficulty levels: easy (40-45 removed), medium (45-50), hard (50-55)
        difficulty_map = {
            'easy': (35, 40),
            'medium': (45, 50),
            'hard': (55, 60)
        }
        
        remove_count = random.randint(*difficulty_map.get(difficulty, (45, 50)))
        puzzle = copy.deepcopy(grid)
        
        cells = [(i, j) for i in range(9) for j in range(9)]
        random.shuffle(cells)
        
        for i, j in cells[:remove_count]:
            puzzle[i][j] = 0
        
        return puzzle
    
    def generate_puzzle(self, difficulty='medium'):
        """Generate a new Sudoku puzzle"""
        complete_grid = self.generate_complete_grid()
        puzzle = self.remove_numbers(complete_grid, difficulty)
        return puzzle, complete_grid
    
    def check_solution(self, grid):
        """Check if the current grid is a valid complete solution"""
        for i in range(9):
            for j in range(9):
                if grid[i][j] == 0:
                    return False
                
                num = grid[i][j]
                grid[i][j] = 0
                if not self.is_valid(grid, i, j, num):
                    grid[i][j] = num
                    return False
                grid[i][j] = num
        
        return True
