async function innerFunction() {
  try {
    // 模拟可能抛出错误的操作
    JSON.parse("");
    console.log("Inner function executed successfully");
  } catch (error) {
    console.log("Inner function caught error:", error.message);
    // 重新抛出异常
    throw error; // 或者 throw new Error('New error message');
  }
}

async function outerFunction() {
  try {
    await innerFunction();
    console.log("Outer function executed successfully");
  } catch (error) {
    console.log("Outer function caught error:", error.message);
    // 可以继续处理或再次抛出
    throw error;
  }
}

// outerFunction().catch(error => {
//     console.log('Top level caught error:', error.message);
// });

let abortController = null;

// 模拟API请求
const mockApiRequest = async (name, delay, signal) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(`${name} 请求完成`);
    }, delay);

    // 监听中止信号
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error('AbortError'));
    });
  });
};

// 第一个子函数 - 包含3个请求
const processPhase1 = async (signal) => {
  console.log("Starting phase 1");

  try {
    const result1 = await mockApiRequest("阶段1-请求1", 1000, signal);
    console.log(result1);
    if (signal.aborted) throw new Error('AbortError');

    const result2 = await mockApiRequest("阶段1-请求2", 1500, signal);
    console.log(result2);
    if (signal.aborted) throw new Error('AbortError');

    const result3 = await mockApiRequest("阶段1-请求3", 800, signal);
    console.log(result3);
    if (signal.aborted) throw new Error('AbortError');
    console.log("Phase 1 completed");
    return true;
  } catch (error) {
    console.log('Error in phase 1:', error.message);
    throw error;
  }
};

// 第二个子函数 - 包含3个请求
const processPhase2 = async (signal) => {

  try {
    const result1 = await mockApiRequest("阶段2-请求1", 1200, signal);
    console.log(result1);
    if (signal.aborted) throw new Error('AbortError');

    const result2 = await mockApiRequest("阶段2-请求2", 900, signal);
    console.log(result2);
    if (signal.aborted) throw new Error('AbortError');

    const result3 = await mockApiRequest("阶段2-请求3", 1100, signal);
    console.log(result3);
    if (signal.aborted) throw new Error('AbortError');
    console.log("Phase 2 completed");
    return true;
  } catch (error) {
    throw error;
  }
};

// 第三个子函数 - 包含3个请求
const processPhase3 = async (signal) => {
  console.log("Starting phase 3");

  try {
    const result1 = await mockApiRequest("阶段3-请求1", 800, signal);
    console.log(result1);
    if (signal.aborted) throw new Error('AbortError');

    const result2 = await mockApiRequest("阶段3-请求2", 1200, signal);
    console.log(result2);
    if (signal.aborted) throw new Error('AbortError');

    const result3 = await mockApiRequest("阶段3-请求3", 500, signal);
    console.log(result3);
    console.log("All phases completed successfully");
    return true;
  } catch (error) {
    throw error;
  }
};

// 主处理函数
const sendRequests = async (signal) => {
  try {
    await processPhase1(signal);

    await processPhase2(signal);

    await processPhase3(signal);

  } catch (error) {
    if (error.message === "AbortError") {
      console.log("Processing was aborted by the user.");
    } else {
      console.error("Error during processing:", error);
    }
    throw error;
  }
};

// 开始处理
const startProcessing = async () => {

  // 创建新的 AbortController
  abortController = new AbortController();
  const { signal } = abortController;

  try {
    setTimeout(() => {
      console.log("Aborting processing after 3 seconds");
      abortProcessing()
    }, 3000)
    await sendRequests(signal);
  } catch (error) {
    console.log("Processing terminated:", error.message);
  } finally {
    abortController = null;
  }
};

// 中止处理
const abortProcessing = () => {
  if (abortController) {
    abortController.abort();
  }
};
// startProcessing()
function test1 () {
  var chentest
  chentest = 'chentest';
  console.log('111', chentest);
  test2()
}
function test2 () {
  console.log('222', chentest);
}
test1()
