import { NextRequest, NextResponse } from 'next/server';
import { getWorkflows, storeWorkflows, updateWorkflowFeedback } from '@/lib/redis-client';
import { Workflow } from '@/lib/types';

// GET — List workflows for a business
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json(
        { error: 'business_id query parameter is required' },
        { status: 400 }
      );
    }

    const workflows = await getWorkflows(businessId);

    return NextResponse.json({
      success: true,
      workflows,
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflows', details: String(error) },
      { status: 500 }
    );
  }
}

// POST — Create/activate a workflow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, workflow } = body;

    if (!business_id || !workflow) {
      return NextResponse.json(
        { error: 'business_id and workflow are required' },
        { status: 400 }
      );
    }

    const existing = await getWorkflows(business_id);
    const newWorkflow: Workflow = {
      ...workflow,
      business_id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      feedback: { thumbs_up: 0, thumbs_down: 0, edits: [] },
    };

    existing.push(newWorkflow);
    await storeWorkflows(business_id, existing);

    return NextResponse.json({
      success: true,
      workflow: newWorkflow,
    });
  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH — Update workflow with feedback
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, workflow_id, action, edit_text } = body;

    if (!business_id || !workflow_id || !action) {
      return NextResponse.json(
        { error: 'business_id, workflow_id, and action are required' },
        { status: 400 }
      );
    }

    if (!['thumbs_up', 'thumbs_down', 'edit'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be thumbs_up, thumbs_down, or edit' },
        { status: 400 }
      );
    }

    const updated = await updateWorkflowFeedback(
      business_id,
      workflow_id,
      action as 'thumbs_up' | 'thumbs_down' | 'edit',
      edit_text
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workflow: updated,
    });
  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow', details: String(error) },
      { status: 500 }
    );
  }
}
