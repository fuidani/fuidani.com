const books = [
    {
        title: "I Regret Almost Everything",
        author: "Keith McNally",
        cover: "images/IRegretAlmostEverything.webp",
        comment: "I enjoyed this book because it is a biography of someone relatively 'normal'. Most people seem to have have interesting stories to tell that are never read.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
    {
        title: "Memorie di Adriano",
        author: "Marguerite Yourcenar",
        cover: "images/memorieDiAdriano.webp",
        comment: "This is one of my favourite books. I read it many many times. It is a biography of the 'good emperor' Adriano.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
        {
        title: "Una vita come tante",
        author: "Hanya Yanagihara",
        cover: "images/unaVitaComeTante.webp",
        comment: "Amazing book - though a bit heavy. Its a long long book - truly enjoyed it",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
            {
        title: "Dream Count",
        author: "Chimamanda Ngozi Adichie",
        cover: "images/dreamCount.webp",
        comment: "My favourite book of 2025 - She is one of the most famous writers in the African continent. I think she stayed around 10 years since her previous book. Really really really good book",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
            {
        title: "NORWEGIAN SINGLE METHOD",
        author: "James Copeland",
        cover: "images/norwegianSingleMethod.webp",
        comment: "This book has helped improve my times in training - either you do easy runs or you do threshold or subthreshold runs. Nothing in between. In the past I think I was doing too many easy runs and the threshold runs were just too hard",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
            {
        title: "Writers Lovers",
        author: "Lily King",
        cover: "images/writersLovers.webp",
        comment: "I am not sure why yet - but I truly enjoy american contemporary fiction - its my favourite currently. Good book good book.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
                {
        title: "Elon Musk",
        author: "Walter Isaacson",
        cover: "images/elonMusk.webp",
        comment: "A good book about Elon Musk - when someone is very controversial - better read a book about this person to understand them better.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
                {
        title: "Bird by Bird",
        author: "Anne Lamott",
        cover: "images/birdByBird.webp",
        comment: "This is a book about writing. I have convinced myself that I can learn to code by reading books about how to write... books 🤷. I have not learned how to code. But I still enjoy these books.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
                {
        title: "A Philosophy of Software Design",
        author: "John Ousterhout",
        cover: "images/aPhilosophyOfSoftwareDesign.webp",
        comment: "I have read this book to feel cool. Thinking it would teach me how to write any code. I did not learn how to write code but I did feel cool.",
        quotes: [
            "XXXXX",
            "XXXXX"
        ]
    },
];

const bookshelf = document.querySelector("#bookshelf");

if (bookshelf) {
books.forEach(function(book, index) {
    const article = document.createElement("article");
    article.classList.add("book-card");

    article.innerHTML = `
        <img src="${book.cover}" alt="${book.title}">
       
        <div class="book-comment">
            <p>${book.comment}</p>
        </div>
      `;

    bookshelf.appendChild(article);
    article.onclick = function() {
        window.location.href = "book.html?id=" + index;
};
article.style.cursor = "pointer";
});
}
