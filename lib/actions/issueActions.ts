"use server"

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function getIssues() {
  try {
    const issues = await prisma.issue.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        assignees: true,
      },
      orderBy: {
        startMonth: 'asc'
      }
    });
    return issues;
  } catch (error) {
    console.error("Failed to get issues:", error);
    return [];
  }
}

export async function getResolvedIssues() {
  try {
    const issues = await prisma.issue.findMany({
      where: {
        status: "RESOLVED"
      },
      include: {
        assignees: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    return issues;
  } catch (error) {
    console.error("Failed to get resolved issues:", error);
    return [];
  }
}

export async function createIssue(data: {
  startMonth: number;
  endMonth: number;
  problem: string;
  action: string;
  assigneeIds: string[];
}) {
  try {
    const issue = await prisma.issue.create({
      data: {
        startMonth: data.startMonth,
        endMonth: data.endMonth,
        problem: data.problem,
        action: data.action,
        assignees: {
          connect: data.assigneeIds.map(id => ({ id }))
        }
      }
    });
    revalidatePath("/issues");
    revalidatePath("/planner");
    revalidatePath("/dashboard-a");
    return { success: true, issue };
  } catch (error) {
    console.error("Failed to create issue:", error);
    return { success: false, error: "Failed to create issue" };
  }
}

export async function resolveIssue(issueId: string, resolution: string, resolverId: string) {
  try {
    if (!resolution || resolution.trim() === "") {
      return { success: false, error: "กรุณาระบุวิธีแก้ปัญหา" };
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: "RESOLVED",
        resolution,
        resolverId,
      }
    });
    revalidatePath("/issues");
    revalidatePath("/planner");
    revalidatePath("/dashboard-a");
    return { success: true, issue };
  } catch (error) {
    console.error("Failed to resolve issue:", error);
    return { success: false, error: "Failed to resolve issue" };
  }
}

export async function updateIssue(id: string, data: {
  startMonth: number;
  endMonth: number;
  problem: string;
  action: string;
  assigneeIds: string[];
}) {
  try {
    const issue = await prisma.issue.update({
      where: { id },
      data: {
        startMonth: data.startMonth,
        endMonth: data.endMonth,
        problem: data.problem,
        action: data.action,
        assignees: {
          set: [], 
          connect: data.assigneeIds.map(id => ({ id }))
        }
      }
    });
    revalidatePath("/issues");
    revalidatePath("/planner");
    revalidatePath("/dashboard-a");
    return { success: true, issue };
  } catch (error) {
    console.error("Failed to update issue:", error);
    return { success: false, error: "Failed to update issue" };
  }
}

export async function deleteIssue(id: string) {
  try {
    await prisma.issue.delete({
      where: { id }
    });
    revalidatePath("/issues");
    revalidatePath("/planner");
    revalidatePath("/dashboard-a");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete issue:", error);
    return { success: false, error: "Failed to delete issue" };
  }
}
