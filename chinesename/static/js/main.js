// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('nameForm');
    const resultsSection = document.getElementById('results');
    const nameTemplate = document.getElementById('nameResultTemplate');

    // 保存名字并生成图片
    async function saveNameCard(nameCard) {
        const options = {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: true, // 开启日志
            onclone: function(clonedDoc) {
                const clonedCard = clonedDoc.querySelector('.name-result');
                if (clonedCard) {
                    console.log('Cloned card styles:', window.getComputedStyle(clonedCard));
                    console.log('Original card styles:', window.getComputedStyle(nameCard));
                    
                    // 检查所有子元素的样式
                    const elements = clonedCard.querySelectorAll('*');
                    elements.forEach(el => {
                        const styles = window.getComputedStyle(el);
                        console.log(`Element ${el.tagName} styles:`, {
                            background: styles.background,
                            backgroundColor: styles.backgroundColor,
                            opacity: styles.opacity,
                            boxShadow: styles.boxShadow,
                            textShadow: styles.textShadow
                        });
                    });
                    
                    // 确保背景色正确
                    clonedCard.style.backgroundColor = '#ffffff';
                    const header = clonedCard.querySelector('.name-header');
                    if (header) {
                        header.style.backgroundColor = '#e75480';
                    }
                    const saveButton = clonedCard.querySelector('.save-name');
                    if (saveButton) {
                        saveButton.style.display = 'none';
                    }
                }
            }
        };

        try {
            console.log('Starting to generate canvas...');
            const canvas = await html2canvas(nameCard, options);
            console.log('Canvas generated:', canvas);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'chinese-name.png';
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error saving name card:', error);
        }
    }

    // 清空结果区域
    function clearResults() {
        resultsSection.innerHTML = '';
    }

    // 显示加载状态
    function showLoading() {
        clearResults();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = '正在生成名字...';
        resultsSection.appendChild(loadingDiv);
    }

    // 显示错误信息
    function showError(message) {
        clearResults();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = `出错了：${message}`;
        resultsSection.appendChild(errorDiv);
    }

    // Display the generated names
    function displayResults(names) {
        clearResults();
        names.forEach(name => {
            const nameElement = nameTemplate.content.cloneNode(true);
            const card = nameElement.querySelector('.name-result');
            
            // Fill in the template
            nameElement.querySelector('.chinese-name').textContent = name.chinese;
            nameElement.querySelector('.pinyin').textContent = name.pinyin;
            
            // Characters meaning
            const charactersText = Object.entries(name.characters)
                .map(([char, meaning]) => `${char}: ${meaning}`)
                .join('\n');
            nameElement.querySelector('.characters').textContent = charactersText;
            
            // Other details
            nameElement.querySelector('.cultural-elements p').textContent = name.cultural;
            nameElement.querySelector('.personality p').textContent = name.personality;
            nameElement.querySelector('.english-explanation p').textContent = name.english;

            // Add save functionality
            const saveButton = nameElement.querySelector('.save-name');
            saveButton.addEventListener('click', () => {
                saveNameCard(card);
            });

            resultsSection.appendChild(nameElement);
        });
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const englishName = document.getElementById('englishName').value.trim();
        const gender = document.querySelector('input[name="gender"]:checked').value;
        
        if (!englishName) {
            showError('请输入英文名');
            return;
        }

        try {
            showLoading();
            const { generateChineseNames } = await import('./api.js');
            const result = await generateChineseNames(englishName, gender);
            displayResults(result.names);
        } catch (error) {
            showError(error.message);
        }
    });
});
