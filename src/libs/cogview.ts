export async function draw(prompt: string, apiKey: string) {
    try {
        const result = await fetch("https://open.bigmodel.cn/api/paas/v4/images/generations", {
            method: "post",
            // signal: AbortSignal.timeout(8000),
            // 开启后到达设定时间会中断流式输出
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "cogview-3-flash",
                prompt: prompt,
                size: "1024x1024",
                n: 1
            }),
        });
        return result;
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}
