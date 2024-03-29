import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/users", (req, res) => {
  const data = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" },
    { id: 3, name: "Sam Doe" },
  ];

  res.send(`
        <h1 class="text-2xl font-bold my-4">Users</h1>
        <ul>
            ${data.map((user) => `<li>${user.name}</li>`).join("")}
        </ul>
    `);
});

app.get("/price", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/internet-computer/market_chart",
      {
        params: {
          vs_currency: "usd",
          days: 3,
          interval: "daily",
        },
        headers: {
          "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
        },
      }
    );

    res.send(`
        <h1 class="text-2xl font-bold my-4">ICP Prices</h1>
        <ul>
            ${response.data.prices
              .map((price) => `<li>${price[1]}</li>`)
              .join("")}
        </ul>
    `);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.send(`
            <h1 class="text-2xl font-bold my-4">Error fetching data</h1>
    `);
  }
});

app.post("/calculate", async (req, res) => {
  const { id, start_date, interval, value } = req.body;
  if (!start_date || !value) {
    return res.send(
      `<h1 class="text-2xl font-bold my-4">Please enter the inputs correctly</h1>`
    );
  }
  const intValue = parseInt(value);
  try {
    const numDays = daysBetween(start_date)
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cryptoId[id]}/market_chart`,
      {
        params: {
          vs_currency: "idr",
          days: numDays,
          interval: "daily",
        },
        headers: {
          "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
        },
      }
    );
    let total = 0;
    let total_capital = 0;
    let dayCount = interval === "weekly" ? 6 : interval === "monthly" ? 29 : 0;
    for (let i = 0; i < response.data.prices.length - 1; i++) {
      const price = response.data.prices[i];
      switch (interval) {
        case "daily":
          total += intValue / price[1];
          total_capital += intValue;
          break;
        case "weekly":
          total += dayCount === 6 ? intValue / price[1] : 0;
          total_capital += dayCount === 6 ? intValue : 0;
          dayCount = (dayCount + 1) % 7;
          break;
        case "monthly":
          total += dayCount === 29 ? intValue / price[1] : 0;
          total_capital += dayCount === 29 ? intValue : 0;
          dayCount = (dayCount + 1) % 30;
          break;
      }
    }
    const prices = response.data.prices;
    const lastPrice = prices.at(-1);
    const asset = total * lastPrice[1];
    const profit = asset - total_capital;
    res.send(`
        <div class="flex flex-col gap-4 min-w-[20rem]">
                <div class="text-left">
                  <p class="font-semibold text-lg">Total token(s)</p>
                  <h3 class="text-4xl font-bold tracking-tighter">
                  ${total.toFixed(8)}&nbsp;${id}
                  </h3>
                </div>
                <div class="text-left">
                  <p class="font-semibold text-lg">Initial Capital</p>
                  <h3 class="text-4xl font-bold tracking-tighter">
                  ${formatRupiah(total_capital)}
                  </h3>
                </div>
                <div class="text-left">
                  <p class="font-semibold text-lg">Asset Value</p>
                  <h3 class="text-4xl font-bold tracking-tighter">
                  ${formatRupiah(asset)}
                  </h3>
                </div>
                <div class="text-left">
                  <p class="font-semibold text-lg">Unrealized Profit/Loss</p>
                  <h3 class="text-4xl font-bold tracking-tighter">
                  ${
                    profit > 0
                      ? "+" + formatRupiah(profit)
                      : formatRupiah(profit)
                  }
                  </h3>
                </div>
              </div>
    `);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.send(`
            <h1 class="text-2xl font-bold my-4">Limit reached! please try again later</h1>
    `);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function daysBetween(startDateStr) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDateStr)) {
    console.error(`Invalid date format: ${startDateStr}`);
    return null;
  }

  const startDate = new Date(startDateStr);

  const today = new Date();

  const timeDiff = today.getTime() - startDate.getTime();

  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff;
}

function formatRupiah(number) {
  let formattedNumber = number.toFixed(2);

  formattedNumber = "Rp" + formattedNumber.replace(".", ",");

  let rupiah = formattedNumber.toString().split(",");
  rupiah[0] = rupiah[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return rupiah.join(",");
}

const cryptoId = {
  BTC: "bitcoin",
  ETH: "ethereum",
  ICP: "internet-computer",
  SOL: "solana",
  GALA: "gala",
  RNDR: "render-token",
  AR: "arweave",
  INJ: "injective-protocol",
  FLOKI: "floki",
};
