// document.addEventListener("DOMContentLoaded", function () {
//   document.querySelectorAll(".save-btn").forEach((btn) => {
//     btn.addEventListener("click", async function () {
//       const collectionId = this.dataset.id;
//       const collectionTitle = this.dataset.title;
//       const customerId = this.dataset.customerId;
//       const customerName = this.dataset.customerName;

//       try {
//         const res = await fetch("/apps/save-collection", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             collectionId,
//             collectionTitle,
//             customerId,
//             customerName
//           }),
//         });

//         const data = await res.json();

//         if (data.success) {
//           this.innerText = "Saved ❤️";
//         } else {
//           alert(data.message);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     });
//   });
// });



// document.addEventListener("DOMContentLoaded", function () {
//   document.querySelectorAll(".save-btn").forEach((btn) => {
//     btn.addEventListener("click", async function () {
//       const collectionId = this.dataset.id;
//       const collectionTitle = this.dataset.title;
//       const customerId = this.dataset.customerId;
//       const customerName = this.dataset.customerName;

//       try {
//         const res = await fetch("/apps/save-collection", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             collectionId,
//             collectionTitle,
//             customerId,
//             customerName
//           }),
//         });

//         const data = await res.json();

//         if (data.success) {
//           this.innerText = "Saved ❤️";
//         } else {
//           alert(data.message);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     });
//   });
// });


function updateTotalPrice() {
  let total = 0;

  document.querySelectorAll(".product-row").forEach((row) => {
    const check = row.querySelector(".product-check");

    if (check.checked) {
      const basePrice = parseFloat(row.querySelector(".product-price").dataset.price);
      const qty = parseInt(row.querySelector(".qty").innerText);

      total += basePrice * qty;
    }
  });

  document.querySelector(".totalproceall").innerText = `Total Price : ₹${total.toFixed(2)}`;
}

function updateCount() {
  const count = document.querySelectorAll("#productList input:checked").length;
  document.getElementById("selectedCount").innerText = `${count} selected`;
}

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("product-check")) {
    const row = e.target.closest(".product-row");
    const qtyEl = row.querySelector(".qty");

    if (e.target.checked) {
      qtyEl.innerText = 2; // ✅ set default 2 when selected
    } else {
      qtyEl.innerText = 1; // optional reset
    }

    updateRowPrice(row);
    updateCount();
    updateTotalPrice();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("collectionModal");
  const productList = document.getElementById("productList");
  const modalTitle = document.getElementById("modalTitle");

  let currentCollection = null;

  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", async function (e) {
      e.preventDefault(); // 🔥 IMPORTANT (page reload stop)

      //  IMPORTANT: not api call
      const collectionId = this.dataset.id;
      const collectionTitle = this.dataset.title;
      const customerId = this.dataset.customerId;

      currentCollection = {
        collectionId,
        collectionTitle,
        customerId,
      };

      modalTitle.innerText = collectionTitle;
      let maxSelection = 0;

      // number extract (5 Dinner → 5)
      const match = collectionTitle.match(/\d+/);

      if (match) {
        maxSelection = parseInt(match[0]);
      } else {
        maxSelection = 0;
      }

      console.log("Max allowed:", maxSelection);
      productList.innerHTML = "Loading products...";

      // 👇 handle extract
      const url = this.closest(".collection-card").querySelector("a").getAttribute("href");
      const handle = url.replace("/collections/", "").split("?")[0];
      try {
        const res = await fetch(`/collections/${handle}/products.json`);
        const data = await res.json();

        productList.innerHTML = "";

        data.products.forEach((product) => {
          const div = document.createElement("div");
          div.classList.add("product-item");

          div.innerHTML = `
  <div class="product-row">

    <input type="checkbox" class="product-check" value="${product.id}" />

    <img 
      src="${product.images?.[0]?.src || 'https://via.placeholder.com/50'}" 
      class="product-img"
    />

    <div class="product-info">
      <span class="product-title">${product.title}</span>
      <span class="product-price" data-price="${product.variants?.[0]?.price}">
        ₹${product.variants?.[0]?.price}
      </span>
    </div>

    <div class="qty-box">
      <button class="qty-minus">-</button>
      <span class="qty">1</span>
      <button class="qty-plus">+</button>
    </div>

  </div>
`;

          productList.appendChild(div);
        });

        // 🔥 AUTO SELECT FIRST N PRODUCTS
        const rows = document.querySelectorAll(".product-row");

        rows.forEach((row, index) => {
          const checkbox = row.querySelector(".product-check");
          const qtyEl = row.querySelector(".qty");

          if (index < maxSelection) {
            checkbox.checked = true;
            qtyEl.innerText = 2; // ✅ default 2
          } else {
            checkbox.checked = false;
            qtyEl.innerText = 1;
          }
        });

        updateCount();
        updateTotalPrice(); // ✅ ADD THIS


        modal.classList.remove("hidden");

      } catch (err) {
        console.error(err);
        productList.innerHTML = "Failed to load products";
      }
    });
  });

  //  close modal
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.onclick = () => {
      modal.classList.add("hidden");
    };
  });



  document.getElementById("searchProduct").addEventListener("input", function () {
    const value = this.value.toLowerCase();

    document.querySelectorAll(".product-item").forEach((item) => {
      const text = item.innerText.toLowerCase();
      item.style.display = text.includes(value) ? "block" : "none";
    });
  });



  // ✅ FINAL SAVE BUTTON
  document.getElementById("confirmSelection").onclick = async () => {
    const selectedProducts = [];

    document.querySelectorAll(".product-row").forEach((row) => {
      const qty = parseInt(row.querySelector(".qty").innerText);

      const check = row.querySelector(".product-check");

      if (check.checked) {
        selectedProducts.push({
          productId: check.value,
          quantity: qty
        });
      }
    });

    console.log("Selected:", selectedProducts);

    if (!currentCollection) {
      alert("Collection data missing");
      return;
    }

    try {
      const res = await fetch("/apps/save-collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentCollection,
          selectedProducts,
        }),
      });

      const result = await res.json();
      console.log(result);

      alert("Saved successfully 🎉");
      modal.classList.add("hidden");

    } catch (err) {
      console.error(err);
      alert("Save failed ❌");
    }
  };
});

// quantity inc/dec code 

document.addEventListener("click", (e) => {

  // ➕ INCREMENT
  if (e.target.classList.contains("qty-plus")) {
    const row = e.target.closest(".product-row");
    const qtyEl = row.querySelector(".qty");
    const check = row.querySelector(".product-check");
    const priceEl = row.querySelector(".product-price");

    let qty = parseInt(qtyEl.innerText);
    qty++;

    qtyEl.innerText = qty;
    check.checked = true;

    updateRowPrice(row);
    updateCount();
    updateTotalPrice(); // ✅ ADD

  }

  // ➖ DECREMENT
  if (e.target.classList.contains("qty-minus")) {
    const row = e.target.closest(".product-row");
    const qtyEl = row.querySelector(".qty");
    const check = row.querySelector(".product-check");

    let qty = parseInt(qtyEl.innerText);

    if (qty > 1) {
      qty--;
      qtyEl.innerText = qty;
    }

    if (qty === 0) {
      check.checked = false;
    }

    updateRowPrice(row);
    updateCount();
    updateTotalPrice(); // ✅ ADD
  }

});


function updateRowPrice(row) {
  const basePrice = parseFloat(row.querySelector(".product-price").dataset.price);
  const qty = parseInt(row.querySelector(".qty").innerText);

  const priceEl = row.querySelector(".product-price");

  priceEl.innerText = `₹${(basePrice * qty).toFixed(2)}`;
}
