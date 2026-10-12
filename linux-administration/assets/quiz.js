document.querySelectorAll("[data-quiz]").forEach((quiz) => {
  quiz.querySelectorAll("fieldset[data-answer]").forEach((question) => {
    question.querySelectorAll("input[type=radio]").forEach((input) => {
      input.addEventListener("change", () => {
        const correct = input.value === question.dataset.answer;
        let note = question.querySelector(".feedback");
        if (!note) {
          note = document.createElement("p");
          note.className = "feedback";
          question.appendChild(note);
        }
        const verdict = correct ? "Correct. " : "Not yet. ";
        note.textContent = verdict + question.dataset.why;
        note.dataset.state = correct ? "correct" : "incorrect";
      });
    });
  });
});
