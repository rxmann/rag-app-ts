const queryInput = document.getElementById('queryInput');
const askButton = document.getElementById('askButton');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const resultDiv = document.getElementById('result');
const answerText = document.getElementById('answerText');
const sourcesList = document.getElementById('sourcesList');

askButton.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;

    // Reset UI
    errorDiv.classList.add('hidden');
    resultDiv.classList.add('hidden');
    loading.classList.remove('hidden');
    askButton.disabled = true;

    try {
        const response = await fetch('/api/rag/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch answer');
        }

        answerText.textContent = data.answer;
        sourcesList.innerHTML = '';
        data.sources.forEach(source => {
            const li = document.createElement('li');
            li.textContent = `${source.filename} (Page: ${source.pageNumber ?? 'N/A'})`;
            sourcesList.appendChild(li);
        });
        resultDiv.classList.remove('hidden');
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
        askButton.disabled = false;
    }
});
