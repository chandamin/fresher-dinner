document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const collectionId = this.dataset.id;
      const customerId = this.dataset.customerId;

      try {
        const res = await fetch("/apps/save-collection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collectionId,
            customerId,
          }),
        });

        const data = await res.json();

        if (data.success) {
          this.innerText = "Saved ❤️";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    });
  });
});