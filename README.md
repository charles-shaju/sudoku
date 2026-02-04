# Sudoku Game - Django Web Application

A fully functional Sudoku game built with Django, featuring:
- 9×9 Sudoku grid with prefilled and user-input cells
- Real-time validation to prevent duplicate numbers in rows, columns, and 3×3 boxes
- Check Solution button
- Reset / New Game options
- Timer to track completion time
- Completion message on success
- Three difficulty levels (Easy, Medium, Hard)
- Responsive design for mobile and desktop

## Features

✅ **Interactive 9×9 Grid** - User-friendly interface with clear visual feedback  
✅ **Real-time Validation** - Invalid entries are highlighted in red immediately  
✅ **Multiple Difficulty Levels** - Easy, Medium, and Hard puzzles  
✅ **Timer** - Track how long it takes to solve the puzzle  
✅ **Check Solution** - Verify if your solution is correct  
✅ **Reset Game** - Start over with the same puzzle  
✅ **New Game** - Generate a fresh puzzle  
✅ **Keyboard Navigation** - Use arrow keys to move between cells  

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip

### Local Development

1. **Clone or download this project**

2. **Navigate to the project directory**
   ```bash
   cd sudoku
   ```

3. **Create a virtual environment (recommended)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations**
   ```bash
   python3 manage.py migrate
   ```

6. **Collect static files (for production)**
   ```bash
   python3 manage.py collectstatic --noinput
   ```

7. **Run the development server**
   ```bash
   python3 manage.py runserver
   ```

8. **Open your browser and visit**
   ```
   http://127.0.0.1:8000
   ```

## Deployment Options (Free Hosting)

### Option 1: PythonAnywhere (Recommended for beginners)

1. Create a free account at [PythonAnywhere](https://www.pythonanywhere.com)
2. Upload your project files or clone from Git
3. Create a new web app (Python 3.x)
4. Configure the WSGI file to point to your Django project
5. Set up static files mapping: `/static/` → `/home/yourusername/sudoku/staticfiles/`
6. Run `python manage.py collectstatic` in the Bash console
7. Reload your web app

### Option 2: Render.com

1. Create account at [Render](https://render.com)
2. Create a new Web Service
3. Connect your Git repository
4. Set build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
5. Set start command: `gunicorn sudoku_project.wsgi:application`
6. Add `gunicorn` to requirements.txt
7. Deploy!

### Option 3: Railway.app

1. Create account at [Railway](https://railway.app)
2. Create new project from GitHub repo
3. Railway will auto-detect Django
4. Add environment variables if needed
5. Deploy automatically

### Option 4: Heroku (with free tier alternatives)

1. Install Heroku CLI
2. Create `Procfile` with: `web: gunicorn sudoku_project.wsgi`
3. Add `gunicorn` to requirements.txt
4. Deploy using Git

## Project Structure

```
sudoku/
├── game/                      # Main game app
│   ├── static/
│   │   └── game/
│   │       ├── css/
│   │       │   └── style.css  # Game styling
│   │       └── js/
│   │           └── game.js    # Game logic
│   ├── templates/
│   │   └── game/
│   │       └── index.html     # Main game page
│   ├── sudoku_generator.py    # Puzzle generation & validation
│   ├── views.py               # Django views
│   └── urls.py                # URL routing
├── sudoku_project/            # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py
├── requirements.txt
└── README.md
```

## How to Play

1. **Select Difficulty**: Choose Easy, Medium, or Hard
2. **Click "New Game"**: Generate a new puzzle
3. **Fill the Grid**: 
   - Click on empty cells to enter numbers 1-9
   - Use arrow keys to navigate between cells
   - Invalid entries will turn red immediately
4. **Check Solution**: Click "Check Solution" when done
5. **Reset**: Start over with the same puzzle
6. **Timer**: Automatically tracks your solving time

## Game Rules

- Each row must contain the numbers 1-9 without repetition
- Each column must contain the numbers 1-9 without repetition
- Each 3×3 box must contain the numbers 1-9 without repetition

## Technologies Used

- **Backend**: Django 4.2
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with gradient backgrounds
- **Algorithm**: Backtracking algorithm for puzzle generation

## Customization

### Change Difficulty Distribution
Edit `game/sudoku_generator.py` and modify the `difficulty_map` in the `remove_numbers` method:

```python
difficulty_map = {
    'easy': (35, 40),    # Numbers to remove
    'medium': (45, 50),
    'hard': (55, 60)
}
```

### Change Color Scheme
Edit `game/static/game/css/style.css` and modify the color variables.

## Troubleshooting

**Static files not loading?**
- Run `python manage.py collectstatic`
- Check that `STATIC_ROOT` is set in settings.py
- Verify static file paths in your hosting platform

**Database errors?**
- Run `python manage.py migrate`
- Delete `db.sqlite3` and run migrations again

**CSRF errors?**
- Make sure Django middleware includes CSRF middleware
- Check that ALLOWED_HOSTS includes your domain

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please create an issue in the repository.

---

**Enjoy playing Sudoku! 🎮**
