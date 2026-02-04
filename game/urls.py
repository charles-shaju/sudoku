from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('new-game/', views.new_game, name='new_game'),
    path('hint/', views.hint, name='hint'),
    path('check-solution/', views.check_solution, name='check_solution'),
    path('validate-move/', views.validate_move, name='validate_move'),
]
