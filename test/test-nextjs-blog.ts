import test from "node:test";

import { NextJSBlog } from "@/install/components/nextjs-blog";

test('NextJS component creates a new stack', async (t) => {
  const blog = new NextJSBlog("test-blog");
});