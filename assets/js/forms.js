// Subscribe form on first screen of main pages

document.addEventListener("DOMContentLoaded", function () {
  const subscribeForm = document.forms.subscribeForm;
  if (!subscribeForm) return;

  subscribeForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const rData = {
      email: subscribeForm.email.value,
      subscribed: true,
      referrer: document.referrer || "DIRECT",
      landing: document.location.href || "EMPTY",
    };

    // fetch(
    //   "https://events.sendpulse.com/events/id/da18edc0831c498ba35c711f5e867e54/7755923",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(rData),
    fetch("https://your-worker-name.workers.dev", { // URL вашого воркера
      method: "POST",
      body: JSON.stringify({ email: email })
    }).then((response) => {
      if (response.ok) {
        console.log("ok");
      }
    });

    console.log(rData);
    subscribeForm.parentElement.classList.add("tnx");
  });
});

// document.addEventListener("DOMContentLoaded", function () {
//   const subscribeForm = document.forms.subscribeForm;
//   if (!subscribeForm) return;

//   subscribeForm.addEventListener("submit", function (e) {
//     e.preventDefault();
//     const email = subscribeForm.email.value;

//     fetch("https://your-worker-name.workers.dev", { // URL вашого воркера
//       method: "POST",
//       body: JSON.stringify({ email: email })
//     }).then(response => {
//       if (response.ok) {
//         subscribeForm.parentElement.classList.add("tnx");
//       }
//     });
//   });
// });
