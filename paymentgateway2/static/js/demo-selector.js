const scenarioCards = document.querySelectorAll('.scenario-card');

scenarioCards.forEach(card => {
  const button = card.querySelector('button');
  button.addEventListener('click', () => {
    const scenario = card.dataset.scenario;
    window.location.href = `/walkthrough?scenario=${scenario}`;
  });
});
