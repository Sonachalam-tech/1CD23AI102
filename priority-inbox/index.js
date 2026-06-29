import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env") });

const API_URL = "http://4.224.186.144/evaluation-service/notifications";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const TYPE_WEIGHTS = {
  Result: 3,
  Event: 2,
  Placement: 1,
};

async function fetchAllNotifications() {
  let page = 1;
  const limit = 50;
  let allNotifications = [];

  console.log("Fetching notifications from API...\n");

  while (true) {
    const url = `${API_URL}?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const notifications = data.notifications ?? [];

    if (notifications.length === 0) break;

    allNotifications = allNotifications.concat(notifications);

    if (notifications.length < limit) break;

    page++;
  }

  console.log(`Total notifications fetched: ${allNotifications.length}\n`);
  return allNotifications;
}

function calculatePriorityScore(notification, oldestTimestamp, newestTimestamp) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] ?? 1;
  const notifTime = new Date(notification.Timestamp).getTime();

  const timeRange = newestTimestamp - oldestTimestamp;

  const recencyScore =
    timeRange === 0 ? 1 : (notifTime - oldestTimestamp) / timeRange;

  return typeWeight * (1 + recencyScore);
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0];
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].score <= this.heap[index].score) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.heap[left].score < this.heap[smallest].score) {
        smallest = left;
      }
      if (right < length && this.heap[right].score < this.heap[smallest].score) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

function getTopNNotifications(notifications, n) {
  if (notifications.length === 0) return [];

  const timestamps = notifications.map((notif) =>
    new Date(notif.Timestamp).getTime()
  );
  const oldestTimestamp = Math.min(...timestamps);
  const newestTimestamp = Math.max(...timestamps);

  const heap = new MinHeap();

  for (const notification of notifications) {
    const score = calculatePriorityScore(
      notification,
      oldestTimestamp,
      newestTimestamp
    );

    if (heap.size() < n) {
      heap.push({ notification, score });
    } else if (score > heap.peek().score) {
      heap.pop();
      heap.push({ notification, score });
    }
  }

  const result = [];
  while (heap.size() > 0) {
    result.push(heap.pop());
  }

  return result.sort((a, b) => b.score - a.score);
}

function displayPriorityInbox(topN, n) {
  console.log("=".repeat(65));
  console.log(`  PRIORITY INBOX — TOP ${n} NOTIFICATIONS`);
  console.log("=".repeat(65));

  topN.forEach((item, index) => {
    const { notification, score } = item;
    const typeWeight = TYPE_WEIGHTS[notification.Type] ?? 1;
    const timestamp = new Date(notification.Timestamp).toLocaleString();

    console.log(`\n  #${index + 1}`);
    console.log(`  ID       : ${notification.ID}`);
    console.log(`  Type     : ${notification.Type}  (weight: ${typeWeight})`);
    console.log(`  Message  : ${notification.Message}`);
    console.log(`  Time     : ${timestamp}`);
    console.log(`  Score    : ${score.toFixed(4)}`);
    console.log("  " + "-".repeat(62));
  });

  console.log("\n" + "=".repeat(65));
}

async function main() {
  const n = parseInt(process.argv[2]) || 10;

  console.log("=".repeat(65));
  console.log(`  Priority Inbox — fetching top ${n} notifications`);
  console.log("=".repeat(65));
  console.log();

  try {
    const notifications = await fetchAllNotifications();

    if (notifications.length === 0) {
      console.log("No notifications found.");
      return;
    }

    const topN = getTopNNotifications(notifications, n);
    displayPriorityInbox(topN, n);

    console.log("\nApproach summary:");
    console.log(`  Total notifications processed : ${notifications.length}`);
    console.log(`  Top N requested               : ${n}`);
    console.log(`  Algorithm                     : Min-Heap O(M log N)`);
    console.log(
      `  Type weights                  : Result=${TYPE_WEIGHTS.Result}, Event=${TYPE_WEIGHTS.Event}, Placement=${TYPE_WEIGHTS.Placement}`
    );
    console.log(
      "  Recency                       : Normalized 0–1 across full dataset\n"
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();