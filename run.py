#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Запуск Flask приложения как standalone приложения
"""

import os
import sys
import webbrowser
import threading
import time

# Добавляем текущую директорию в путь
base_path = getattr(sys, '_MEIPASS', os.path.abspath(os.path.dirname(__file__)))
os.chdir(base_path)

# Создаем необходимые папки
os.makedirs('sites', exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('static/style', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

# Создаем example сайт если папки пустые
example_site_path = os.path.join('sites', 'example_site')
if not os.listdir('sites'):
    os.makedirs(example_site_path, exist_ok=True)
    with open(os.path.join(example_site_path, 'index.html'), 'w', encoding='utf-8') as f:
        f.write("""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Пример сайта</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea20, #764ba220);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 20px;
        }
        h1 { color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ Добро пожаловать!</h1>
        <p>Это пример сайта. Вы можете добавлять свои сайты в папку <strong>sites</strong></p>
        <p>Просто создайте новую папку и поместите в неё index.html</p>
    </div>
</body>
</html>""")

# Импортируем Flask приложение
from app import app

def open_browser():
    """Открывает браузер через 1.5 секунды"""
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:5000')

if __name__ == '__main__':
    print("_" * 60)
    print("Запуск SmartVendor Навигатора...")
    print("Папка с сайтами:", os.path.abspath('sites'))
    print("Сервер запускается...")
    print("_" * 60)
    
    # Открываем браузер в отдельном потоке
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Запускаем сервер
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)