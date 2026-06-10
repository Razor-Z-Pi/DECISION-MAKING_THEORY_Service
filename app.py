from flask import Flask, render_template, send_from_directory, request, jsonify, send_file
import os
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

# Для корректной работы в .exe
if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

app = Flask(__name__)
app.config['SITES_FOLDER'] = 'sites'

os.makedirs(app.config['SITES_FOLDER'], exist_ok = True)
os.makedirs('templates', exist_ok = True)
os.makedirs('static/style', exist_ok = True)
os.makedirs('static/js', exist_ok = True)

SITES_CONFIG_FILE = 'sites_config.json'

def load_sites_config():
    """Загрузка конфигурации сайтов"""
    if os.path.exists(SITES_CONFIG_FILE):
        with open(SITES_CONFIG_FILE, 'r', encoding = 'utf-8') as f:
            return json.load(f)
    
    config = {'tab1': {'name': 'Главная', 'path': None, 'type': 'default'}}
    
    if os.path.exists(app.config['SITES_FOLDER']):
        tab_num = 2
        for folder in sorted(os.listdir(app.config['SITES_FOLDER'])):
            folder_path = os.path.join(app.config['SITES_FOLDER'], folder)
            if os.path.isdir(folder_path) and not folder.startswith('.'):
                config[f'tab{tab_num}'] = {
                    'name': folder,
                    'path': folder_path,
                    'type': 'folder'
                }
                tab_num += 1
    
    save_sites_config(config)
    return config

def save_sites_config(config):
    with open(SITES_CONFIG_FILE, 'w', encoding = 'utf-8') as f:
        json.dump(config, f, ensure_ascii = False, indent = 2)

def fix_html_paths(html_content, folder_name):
    """Исправляет относительные пути в HTML"""
    
    # Базовый URL для папки сайта
    base_url = f'/site-files/{folder_name}/'
    
    def replace_path(match):
        attr = match.group(1)
        path = match.group(2)
        
        if path.startswith(('http://', 'https://', '//', 'data:', '#', 'mailto:', 'tel:')):
            return f'{attr}="{path}"'
        
        if path.startswith('/site-files/'):
            return f'{attr}="{path}"'
        
        # Очищаем путь
        clean_path = path.replace('\\', '/')
        
        new_path = urljoin(base_url, clean_path)
        return f'{attr}="{new_path}"'
    
    pattern = r'(src|href)=["\']([^"\']+)["\']'
    fixed_html = re.sub(pattern, replace_path, html_content)
    
    if '<base' not in fixed_html and '<head>' in fixed_html:
        fixed_html = fixed_html.replace('<head>', f'<head><base href="{base_url}">')
    
    return fixed_html

def get_site_html(site_path, folder_name):
    """Получение HTML содержимого с исправлением путей"""
    if not site_path:
        return None
    
    # Ищем index.html
    index_path = os.path.join(site_path, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding = 'utf-8') as f:
            content = f.read()
            # Исправляем пути
            fixed_content = fix_html_paths(content, folder_name)
            return fixed_content
    
    html_files = list(Path(site_path).glob('*.html'))
    if html_files:
        with open(html_files[0], 'r', encoding = 'utf-8') as f:
            content = f.read()
            fixed_content = fix_html_paths(content, folder_name)
            return fixed_content
    
    return None

@app.route('/')
def index():
    sites_config = load_sites_config()
    return render_template('index.html', sites_config = sites_config)

@app.route('/static/style/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/style', filename)

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/site-files/<folder>/<path:filename>')
def serve_site_file(folder, filename):
    """Отдает любые файлы из папки сайта (CSS, JS, изображения, шрифты и т.д.)"""
    site_folder = os.path.join(app.config['SITES_FOLDER'], folder)
    file_path = os.path.join(site_folder, filename)
    
    # Безопасность: проверяем, что файл внутри папки сайта
    real_path = os.path.abspath(file_path)
    real_site_folder = os.path.abspath(site_folder)
    
    if not real_path.startswith(real_site_folder):
        return 'Access denied', 403
    
    if os.path.exists(real_path) and os.path.isfile(real_path):
        # Определяем MIME тип
        ext = os.path.splitext(filename)[1].lower()
        mimetypes = {
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.txt': 'text/plain'
        }
        mimetype = mimetypes.get(ext, 'application/octet-stream')
        return send_file(real_path, mimetype=mimetype)
    
    return 'File not found', 404

@app.route('/api/site/<tab_id>')
def get_site(tab_id):
    """API для получения содержимого сайта"""
    sites_config = load_sites_config()
    
    if tab_id not in sites_config:
        return jsonify({'error': 'Site not found'}), 404
    
    site = sites_config[tab_id]
    
    if site['type'] == 'default':
        return jsonify({
            'html': render_template('default_home.html'),
            'title': 'Главная'
        })
    
    elif site['type'] == 'folder' and site['path']:
        folder_name = os.path.basename(site['path'])
        html_content = get_site_html(site['path'], folder_name)
        
        if html_content:
            return jsonify({
                'html': html_content,
                'title': site['name']
            })
        else:
            # Заглушка если нет HTML
            return jsonify({
                'html': f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>{site['name']}</title>
<style>
    body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 30px; border-radius: 20px; }}
    h1 {{ color: #667eea; }}
    button {{ padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }}
</style>
</head>
<body>
    <div class="container">
        <h1>📁 {site['name']}</h1>
        <p>В папке нет HTML файла.</p>
        <button onclick="window.parent.uploadFileToCurrentTab()">📁 Загрузить HTML</button>
    </div>
</body>
</html>""",
                'title': site['name']
            })
    
    return jsonify({'error': 'Invalid site type'}), 400

@app.route('/api/sites', methods = ['GET'])
def get_sites():
    sites_config = load_sites_config()
    return jsonify(sites_config)

@app.route('/api/sites', methods = ['POST'])
def add_site():
    data = request.json
    sites_config = load_sites_config()
    
    tab_num = len(sites_config) + 1
    tab_id = f'tab{tab_num}'
    
    site_type = data.get('type', 'folder')
    site_name = data.get('name', f'Сайт {tab_num - 1}')
    
    if site_type == 'folder':
        folder_name = data.get('path', site_name.lower().replace(' ', '_'))
        folder_path = os.path.join(app.config['SITES_FOLDER'], folder_name)
        os.makedirs(folder_path, exist_ok = True)
        
        sites_config[tab_id] = {
            'name': site_name,
            'path': folder_path,
            'type': 'folder'
        }
    else:
        sites_config[tab_id] = {
            'name': site_name,
            'type': 'embedded',
            'content': data.get('content', f'<h1>{site_name}</h1><p>Содержимое сайта</p>')
        }
    
    save_sites_config(sites_config)
    return jsonify({'success': True, 'tab_id': tab_id})

@app.route('/api/sites/<tab_id>', methods = ['PUT'])
def update_site(tab_id):
    data = request.json
    sites_config = load_sites_config()
    
    if tab_id not in sites_config:
        return jsonify({'error': 'Site not found'}), 404
    
    if 'name' in data:
        sites_config[tab_id]['name'] = data['name']
    
    if 'content' in data:
        if sites_config[tab_id]['type'] == 'folder' and sites_config[tab_id].get('path'):
            folder_path = sites_config[tab_id]['path']
            index_path = os.path.join(folder_path, 'index.html')
            with open(index_path, 'w', encoding = 'utf-8') as f:
                f.write(data['content'])
        elif sites_config[tab_id]['type'] == 'embedded':
            sites_config[tab_id]['content'] = data['content']
    
    save_sites_config(sites_config)
    return jsonify({'success': True})

@app.route('/api/upload', methods = ['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    tab_id = request.form.get('tab_id', '')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.html'):
        content = file.read().decode('utf-8')
        sites_config = load_sites_config()
        
        if tab_id in sites_config:
            if sites_config[tab_id]['type'] == 'folder' and sites_config[tab_id].get('path'):
                folder_path = sites_config[tab_id]['path']
                index_path = os.path.join(folder_path, 'index.html')
                with open(index_path, 'w', encoding='utf-8') as f:
                    f.write(content)
            else:
                sites_config[tab_id]['type'] = 'embedded'
                sites_config[tab_id]['content'] = content
            
            save_sites_config(sites_config)
            return jsonify({'success': True, 'content': content})
    
    return jsonify({'error': 'Invalid file'}), 400

@app.route('/api/export', methods = ['GET'])
def export_sites():
    sites_config = load_sites_config()
    export_data = {}
    
    for tab_id, site in sites_config.items():
        if site['type'] == 'default':
            continue
        elif site['type'] == 'embedded':
            export_data[tab_id] = {
                'name': site['name'],
                'content': site.get('content', ''),
                'type': 'embedded'
            }
        elif site['type'] == 'folder' and site.get('path'):
            html = get_site_html(site['path'], os.path.basename(site['path']))
            if html:
                export_data[tab_id] = {
                    'name': site['name'],
                    'content': html,
                    'type': 'folder'
                }
    
    return jsonify(export_data)

@app.route('/api/import', methods = ['POST'])
def import_sites():
    data = request.json
    sites_config = load_sites_config()
    
    for tab_id, site_data in data.items():
        if tab_id not in sites_config and tab_id != 'tab1':
            sites_config[tab_id] = {
                'name': site_data.get('name', f'Импорт {tab_id}'),
                'type': site_data.get('type', 'embedded'),
                'content': site_data.get('content', ''),
                'path': None
            }
    
    save_sites_config(sites_config)
    return jsonify({'success': True})

@app.route('/refresh-sites')
def refresh_sites():
    sites_config = {'tab1': {'name': 'Главная', 'path': None, 'type': 'default'}}
    
    if os.path.exists(app.config['SITES_FOLDER']):
        tab_num = 2
        for folder in sorted(os.listdir(app.config['SITES_FOLDER'])):
            folder_path = os.path.join(app.config['SITES_FOLDER'], folder)
            if os.path.isdir(folder_path) and not folder.startswith('.'):
                sites_config[f'tab{tab_num}'] = {
                    'name': folder,
                    'path': folder_path,
                    'type': 'folder'
                }
                tab_num += 1
    
    save_sites_config(sites_config)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug = True, port = 5000)