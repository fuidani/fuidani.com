const books = [
    {
        title: "I Regret Almost Everything",
        author: "Keith McNally",
        cover: "images/IRegretAlmostEverything.png",
        comment: "I enjoyed this book because it is a biography of someone relatively 'normal'. Most people seem to have have interesting stories to tell that are never read.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
    {
        title: "Memorie di Adriano",
        author: "Marguerite Yourcenar",
        cover: "images/memorieDiAdriano.png",
        comment: "This is one of my favourite books. I read it many many times. It is a biography of the 'good emperor' Adriano.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
        {
        title: "Una vita come tante",
        author: "Hanya Yanagihara",
        cover: "images/unaVitaComeTante.png",
        comment: "Amazing book - though a bit heavy. Its a long long book - truly enjoyed it",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
];

const bookshelf = document.querySelector("#bookshelf");

books.forEach(function(book) {
    const article = document.createElement("article");
    article.classList.add("book-card");

    article.innerHTML = `
        <img src="${book.cover}" alt="${book.title}">
       
        <div class="book-comment">
            <p>${book.comment}</p>
        </div>
      `;

    bookshelf.appendChild(article);
});
