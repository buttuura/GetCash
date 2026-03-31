document.addEventListener('DOMContentLoaded', function() {
  const memberActivityList = document.getElementById('member-activity-list');
  // Larger pool of names for more unique messages
  const memberNames = [
    '*********765', '*********567', '*********786', '*********980', '*********328', '*********876', '*********894', '*********123', '*********432', '*********555',
    '*********111', '*********222', '*********333', '*********444', '*********555', '*********666', '*********777', '*********888', '*********999', '*********000',
    '*********112', '*********223', '*********334', '*********445', '*********556', '*********667', '*********778', '*********889', '*********990', '*********101'
  ];
  const amounts = [
    1750, 7800, 184000, 600000, 284000, 84000, 14000, 32000, 5000, 120000,
    2500, 9000, 210000, 450000, 12000, 35000, 7000, 150000, 20000, 95000,
    3000, 11000, 50000, 80000, 17000, 22000, 40000, 60000, 130000, 175000
  ];
  const tasks = [5, 10, 20, 40, 50, 80, 180, 12, 25, 33, 44, 60, 75, 99, 120];

  // Generate a large shuffled pool of unique messages
  function generateUniqueActivities(count) {
    const set = new Set();
    while (set.size < count) {
      const name = memberNames[Math.floor(Math.random() * memberNames.length)];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      set.add(`Congratulations ${name} completed ${task} Tasks <span class="ugx-amount">UGX${amount.toLocaleString()}</span>`);
    }
    return Array.from(set);
  }

  // Pool of 30 unique messages
  let activityPool = generateUniqueActivities(30);
  let poolIndex = 0;

  // Initialize with 3 lines
  let activities = [activityPool[poolIndex++], activityPool[poolIndex++], activityPool[poolIndex++]];

  function renderActivities() {
    memberActivityList.innerHTML = '';
    activities.forEach((activity, idx) => {
      const div = document.createElement('div');
      div.className = 'activity-line';
      div.innerHTML = activity;
      div.style.transform = 'translateY(0)';
      div.style.opacity = '1';
      memberActivityList.appendChild(div);
    });
  }

  renderActivities();

  setInterval(() => {
    // Animate first line up
    const firstLine = memberActivityList.firstChild;
    if (firstLine) {
      firstLine.style.transform = 'translateY(-100%)';
      firstLine.style.opacity = '0';
    }
    // After animation, remove first, add new last, and re-render
    setTimeout(() => {
      activities.shift();
      // If pool is exhausted, reshuffle
      if (poolIndex >= activityPool.length) {
        activityPool = generateUniqueActivities(30);
        poolIndex = 0;
      }
      activities.push(activityPool[poolIndex++]);
      renderActivities();
    }, 500);
  }, 2000);
});