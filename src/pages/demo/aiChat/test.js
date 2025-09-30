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
  // currentStage.value = "阶段一";
  // logs.value.push("--- 开始阶段一 ---");
  console.log("Starting phase 1");

  try {
    const result1 = await mockApiRequest("阶段1-请求1", 1000, signal);
    console.log(result1);
    // logs.value.push(result1);
    // progress.value = 10;
    // if (signal.aborted) throw new Error('AbortError');

    const result2 = await mockApiRequest("阶段1-请求2", 1500, signal);
    // logs.value.push(result2);
    // progress.value = 20;
    console.log(result2);
    // if (signal.aborted) throw new Error('AbortError');

    const result3 = await mockApiRequest("阶段1-请求3", 800, signal);
    console.log(result3);
    // logs.value.push(result3);
    // progress.value = 30;

    // logs.value.push("--- 阶段一完成 ---");
    console.log("Phase 1 completed");
    return true;
  } catch (error) {
    console.log('Error in phase 1:', error.message);
    // throw error;
  }
};

// 第二个子函数 - 包含3个请求
const processPhase2 = async (signal) => {
  // currentStage.value = "阶段二";
  // logs.value.push("--- 开始阶段二 ---");

  // try {
    const result1 = await mockApiRequest("阶段2-请求1", 1200, signal);
    console.log(result1);
    // logs.value.push(result1);
    // progress.value = 45;
    // if (signal.aborted) throw new Error('AbortError');

    const result2 = await mockApiRequest("阶段2-请求2", 900, signal);
    console.log(result2);
    // logs.value.push(result2);
    // progress.value = 60;
    // if (signal.aborted) throw new Error('AbortError');

    const result3 = await mockApiRequest("阶段2-请求3", 1100, signal);
    console.log(result3);
    // logs.value.push(result3);
    // progress.value = 75;

    // logs.value.push("--- 阶段二完成 ---");
    console.log("Phase 2 completed");
    return true;
  // } catch (error) {
  //   throw error;
  // }
};

// 第三个子函数 - 包含3个请求
const processPhase3 = async (signal) => {
  // currentStage.value = "阶段三";
  // logs.value.push("--- 开始阶段三 ---");
  console.log("Starting phase 3");

  // try {
    const result1 = await mockApiRequest("阶段3-请求1", 800, signal);
    console.log(result1);
    // logs.value.push(result1);
    // progress.value = 85;
    // if (signal.aborted) throw new Error('AbortError');

    const result2 = await mockApiRequest("阶段3-请求2", 1200, signal);
    console.log(result2);
    // logs.value.push(result2);
    // progress.value = 95;
    // if (signal.aborted) throw new Error('AbortError');

    const result3 = await mockApiRequest("阶段3-请求3", 500, signal);
    console.log(result3);
    // logs.value.push(result3);
    // progress.value = 100;

    // logs.value.push("--- 阶段三完成 ---");
    console.log("All phases completed successfully");
    return true;
  // } catch (error) {
  //   throw error;
  // }
};

// 主处理函数
const sendRequests = async (signal) => {
  try {
    await processPhase1(signal);
    // if (signal.aborted) throw new Error('AbortError');

    await processPhase2(signal);
    // if (signal.aborted) throw new Error('AbortError');

    await processPhase3(signal);

    // status.value = "所有处理完成";
    // currentStage.value = "";
  } catch (error) {
    if (error.message === "AbortError") {
      console.log("Processing was aborted by the user.");
      // logs.value.push("处理已被用户中止");
      // status.value = "处理已中止";
    } else {
      console.error("Error during processing:", error);
      // logs.value.push(`处理错误: ${error.message}`);
      // status.value = "处理出错";
    }
    throw error;
  }
};

// 开始处理
const startProcessing = async () => {
  // isProcessing.value = true;
  // status.value = "处理中";
  // progress.value = 0;
  // logs.value = [];
  // currentStage.value = "";

  // 创建新的 AbortController
  abortController = new AbortController();
  const { signal } = abortController;

  try {
    setTimeout(() => {abortProcessing()}, 3000)
    await sendRequests(signal);
  } catch (error) {
    // 错误已在sendRequests中处理
  } finally {
    // isProcessing.value = false;
    abortController = null;
  }
};

// 中止处理
const abortProcessing = () => {
  if (abortController) {
    abortController.abort();
  }
};
startProcessing()
