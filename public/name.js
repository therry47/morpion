// get name-form add 
addEventListener('submit', (event) => {
    const name = document.getElementById('name')?.value;
    if (name) {
    document.cookie = `playerName=${name}`;
    }else {
    event.preventDefault();
    }
});
