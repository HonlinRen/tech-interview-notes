---
title: "算法 LeetCode 题目整理"
permalink: "developer/leetcode.html"
layout: "layouts/topic.njk"
assetPrefix: "../"
category: "leetcode"
---
## Leetcode 15. 三数之和 {#lc-15-3sum}

### 面试快答

先排序，再固定一个数并用双指针寻找其余两数，利用相对大小移动指针并跳过重复值。时间复杂度 O(n²)，空间取决于排序实现与是否计入结果。

### 详细解析

解释三处去重：固定值、左指针和右指针；剪枝必须基于排序后的范围。面试时先说不变量，再走一组包含重复值、全零和无解的例子。

**题目链接**：https://leetcode.cn/problems/3sum/

给你一个整数数组 `nums`，找出所有和为 `0` 且不重复的三元组 `[nums[i], nums[j], nums[k]]`（`i != j != k`）。结果中不能包含重复的三元组。

| 示例 | 输入 | 输出 |
| --- | --- | --- |
| 示例 1 | `[-1, 0, 1, 2, -1, -4]` | `[[-1, -1, 2], [-1, 0, 1]]` |
| 示例 2 | `[0, 1, 1]` | `[]` |
| 示例 3 | `[0, 0, 0]` | `[[0, 0, 0]]` |

约束：`3 <= nums.length <= 3000`，`-10^5 <= nums[i] <= 10^5`。

#### 思路

暴力三重循环是 `O(n³)`。经典优化是**先排序，再固定一个数，剩下两个数用双指针**：

1.  排序后枚举第一个数 `nums[i]`，若 `nums[i] > 0` 可直接结束（后面更大，不可能凑 0）。
2.  在 `[i+1, n-1]` 区间设 `left`、`right`，求 `nums[i] + nums[left] + nums[right] == 0`。
3.  和大于 0 则 `right--`，和小于 0 则 `left++`，等于 0 则记录答案并移动指针。
4.  三个位置都要**跳过重复值**，避免结果重复。

时间复杂度 `O(n²)`，额外空间 `O(1)`（不计排序和输出）。

#### Python 实现

```python
from typing import List


class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        n = len(nums)
        result = []

        for i in range(n - 2):
            if nums[i] > 0:
                break
            if i > 0 and nums[i] == nums[i - 1]:
                continue

            left, right = i + 1, n - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total == 0:
                    result.append([nums[i], nums[left], nums[right]])
                    left += 1
                    right -= 1
                    while left < right and nums[left] == nums[left - 1]:
                        left += 1
                    while left < right and nums[right] == nums[right + 1]:
                        right -= 1
                elif total < 0:
                    left += 1
                else:
                    right -= 1

        return result
```

## Leetcode 134. 加油站 {#lc-134-gas-station}

### 面试快答

若总油量小于总消耗则无解；否则线性扫描，当前候选起点到某站净油量变负时，把起点移到下一站。累计总量负责可行性，局部累计负责淘汰候选。

### 详细解析

证明关键是：失败区间内其他起点不能比当前候选更早积累更多可用油量。覆盖单站、总量刚好相等和连续失败区间，复杂度 O(n)。

**题目链接**：https://leetcode.cn/problems/gas-station/

在一条环路上有 `n` 个加油站，第 `i` 个加油站有 `gas[i]` 升汽油。从第 `i` 站开往第 `i+1` 站（最后一站开往第 0 站）需要消耗 `cost[i]` 升汽油。给定两个数组 `gas` 和 `cost`，若存在某个起点能**顺时针绕一圈回到起点**，返回该起点下标；否则返回 `-1`。题目保证若有解，则解唯一。

| 示例 | 输入 | 输出 |
| --- | --- | --- |
| 示例 1 | `gas = [1,2,3,4,5], cost = [3,4,5,1,2]` | `3` |
| 示例 2 | `gas = [2,3,4], cost = [3,4,3]` | `-1` |
| 示例 3 | `gas = [3,1,1], cost = [1,2,2]` | `0` |

约束：`gas.length == cost.length`，`1 <= gas.length <= 10^5`，`0 <= gas[i], cost[i] <= 10^4`。

#### 思路

暴力枚举每个起点是 `O(n²)`。贪心可一次扫描得到答案：

1.  **必要条件**：若 `sum(gas) < sum(cost)`，总油量不够，直接返回 `-1`。
2.  **贪心选起点**：维护当前剩余油量 `tank` 和候选起点 `start`。从 `0` 出发累加 `gas[i] - cost[i]`。
3.  若某站之后 `tank < 0`，说明 `[start, i]` 区间内任意点都不能作为合法起点，将起点重置为 `i + 1`，`tank` 清零继续。
4.  能走完全程时，`start` 即为唯一答案。

直觉：若从 A 出发到不了 B，则 A 到 B 之间任何站出发都到不了 B（中间只会更早缺油）。时间复杂度 `O(n)`，空间 `O(1)`。

#### Python 实现

```python
from typing import List


class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        if sum(gas) < sum(cost):
            return -1

        start = 0
        tank = 0
        for i in range(len(gas)):
            tank += gas[i] - cost[i]
            if tank < 0:
                start = i + 1
                tank = 0

        return start
```

## LCR 127. 跳跃训练 {#lc-lcr127-jump-training}

### 面试快答

到第 n 阶的方案数由最后一步跳 1 阶或 2 阶划分，得到相邻两项的递推。用两个变量滚动更新，时间 O(n)、额外空间 O(1)。

### 详细解析

边界 n=0 的定义与题目取模要求必须按当前题面实现。不要把递归暴力的重复子问题当成最终方案，解释状态含义和递推依赖后再写代码。

**题目链接**：https://leetcode.cn/problems/qing-wa-tiao-tai-jie-wen-ti-lcof/description/

某体育设施实施改进计划，要在一长条形的平台上铺设 `num` 个格子。运动员可以选择每次跳 **1 个格子或 2 个格子**，从起点跳到第 `num` 个格子。请返回到达第 `num` 个格子时，共有多少种不同的跳跃方式。答案对 `10^9 + 7` 取模。

| 示例 | 输入 | 输出 |
| --- | --- | --- |
| 示例 1 | `num = 2` | `2`（`1+1` 或一次跳 `2`） |
| 示例 2 | `num = 5` | `8` |

约束：`0 <= num <= 100`。

#### 思路

本质是**斐波那契型动态规划**（与「爬楼梯」相同）：到达第 `i` 格，要么从 `i-1` 跳 1 步来，要么从 `i-2` 跳 2 步来。

1.  定义 `dp[i]` 为到达第 `i` 格的方案数，转移方程：`dp[i] = dp[i-1] + dp[i-2]`。
2.  边界：`dp[0] = 1`（起点不动算 1 种），`dp[1] = 1`。
3.  每一步对 `10^9 + 7` 取模，防止溢出。
4.  可用滚动变量把空间优化到 `O(1)`。

时间复杂度 `O(n)`，空间复杂度 `O(1)`。

#### Python 实现

```python
class Solution:
    def trainWays(self, num: int) -> int:
        MOD = 10**9 + 7
        if num <= 1:
            return 1

        prev2, prev1 = 1, 1
        for _ in range(2, num + 1):
            curr = (prev1 + prev2) % MOD
            prev2, prev1 = prev1, curr

        return prev1
```

## Leetcode 300. 最长递增子序列 {#lc-300-lis}

### 面试快答

最长递增子序列可用 O(n²) 动态规划，也可维护每个长度的最小结尾并二分更新到 O(n log n)。维护数组不一定是原数组中的一条实际子序列。

### 详细解析

严格递增时寻找首个大于等于当前值的位置，非严格版本边界不同。若要求输出实际序列，还需保存前驱与对应下标，不能直接返回结尾数组。

**题目链接**：https://leetcode.cn/problems/longest-increasing-subsequence/

给你一个整数数组 `nums`，找到其中**最长严格递增子序列**的长度。子序列由数组中若干元素按原顺序选取组成，不要求连续。

| 示例 | 输入 | 输出 |
| --- | --- | --- |
| 示例 1 | `[10, 9, 2, 5, 3, 7, 101, 18]` | `4`（如 `[2, 3, 7, 101]`） |
| 示例 2 | `[0, 1, 0, 3, 2, 3]` | `4` |
| 示例 3 | `[7, 7, 7, 7, 7, 7, 7]` | `1` |

约束：`1 <= nums.length <= 2500`，`-10^4 <= nums[i] <= 10^4`。

#### 思路

常见两种解法：

1.  **DP O(n²)**：定义 `dp[i]` 为以 `nums[i]` 结尾的 LIS 长度。对每个 `j < i` 且 `nums[j] < nums[i]`，有 `dp[i] = max(dp[i], dp[j] + 1)`。

#### Python 实现

```python
from typing import List
class Solution:
    def lengthOfLIS(self,nums:List[int]) -> int:
        dp = [1]*len(nums)
        for i in range(len(nums)):
            for j in range(i):
                if nums[j] < nums[i]:
                    dp[i] = max(dp[i], dp[j]+1)
        return max(dp)
```

## Leetcode 226. 翻转二叉树 {#lc-226-invert-tree}

### 面试快答

交换每个节点的左右孩子，再递归或迭代处理子树即可翻转二叉树。时间 O(n)，递归空间 O(h)，极端链状树要考虑栈深度。

### 详细解析

说明是否原地修改，覆盖空树、单节点和偏斜树。迭代方案使用栈或队列，工程上应根据语言栈限制和最大树深选择。

**题目链接**：https://leetcode.cn/problems/invert-binary-tree/

给你一棵二叉树的根节点 `root`，**翻转这棵二叉树**，并返回其根节点。翻转即交换每个节点的左右子树。

| 示例 | 输入 | 输出 |
| --- | --- | --- |
| 示例 1 | `root = [4,2,7,1,3,6,9]` | `[4,7,2,9,6,3,1]` |
| 示例 2 | `root = [2,1,3]` | `[2,3,1]` |
| 示例 3 | `root = []` | `[]` |

约束：树中节点数目 `0 <= n <= 100`，`-100 <= Node.val <= 100`。

#### 思路

典型**递归/DFS**题：对每个节点交换左右子树，再递归处理子节点。也可用 BFS 层序遍历，逐层交换左右孩子。

1.  递归基：节点为空直接返回 `None`。
2.  交换当前节点的 `left` 与 `right`。
3.  递归翻转左右子树，最后返回根节点。

时间复杂度 `O(n)`，空间复杂度 `O(h)`（递归栈，`h` 为树高）。

#### Python 实现

```python
from typing import Optional


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None

        root.left, root.right = root.right, root.left
        self.invertTree(root.left)
        self.invertTree(root.right)
        return root
```
