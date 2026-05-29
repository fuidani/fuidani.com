const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const book = books[id];

document.getElementById('book-cover').src = book.cover;
document.getElementById('book-title').innerHTML = book.title;
document.getElementById('book-author').innerHTML = book.author;
document.getElementById('book-comment').innerHTML = book.comment;


const quotesList = document.getElementById('book-quotes');
book.quotes.forEach(function(quote) {
    const li = document.createElement('li');
    li.innerHTML = quote;
    quotesList.appendChild(li);
});