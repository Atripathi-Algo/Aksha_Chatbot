import React from "react";
// tab property

export interface TabPageProps {
  selectedGroup?: string;
  cameraGroups?: {
    group_name: string;
    description: string;
    priority_type: string;
    cameras: { camera_id: string; camera_name: string }[];
  }[];
}

export interface TabProps {
  tabName: { label: string; value: string }[];
  pages: {
    value: string;
    component: React.ReactElement<TabPageProps>;
  }[];
}