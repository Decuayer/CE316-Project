import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  FileArchive,
  FolderPlus,
  ListChecks,
  PlayCircle,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { DashboardStats } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type RecentProject = DashboardStats['recentProjects'][number] & {
  configuration: string;
  language: string;
  trend: string;
};

type DashboardPreviewData = Omit<DashboardStats, 'recentProjects'> & {
  configurations: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  recentProjects: RecentProject[];
};

const dashboardData: DashboardPreviewData = {
  totalProjects: 8,
  totalStudents: 214,
  overallPassRate: 78,
  configurations: 5,
  passCount: 167,
  failCount: 39,
  pendingCount: 8,
  recentProjects: [
    {
      id: 'hw4-sorting',
      name: 'HW4 - Sorting pipelines',
      status: 'completed',
      studentCount: 44,
      passRate: 86,
      lastRun: '2026-04-23T18:20:00.000Z',
      configuration: 'C Programming',
      language: 'C',
      trend: '+6%',
    },
    {
      id: 'lab9-files',
      name: 'Lab 9 - File processing',
      status: 'completed',
      studentCount: 37,
      passRate: 73,
      lastRun: '2026-04-22T14:10:00.000Z',
      configuration: 'Python 3',
      language: 'Python',
      trend: '+2%',
    },
    {
      id: 'midterm-practice',
      name: 'Midterm practice set',
      status: 'pending',
      studentCount: 52,
      passRate: 0,
      lastRun: null,
      configuration: 'Java',
      language: 'Java',
      trend: 'Ready',
    },
    {
      id: 'hw3-strings',
      name: 'HW3 - String transforms',
      status: 'completed',
      studentCount: 41,
      passRate: 68,
      lastRun: '2026-04-20T09:45:00.000Z',
      configuration: 'C++',
      language: 'C++',
      trend: '-4%',
    },
  ],
};

const statCards = [
  {
    label: 'Projects',
    value: dashboardData.totalProjects.toString(),
    detail: 'Open assignments tracked locally',
    icon: ListChecks,
    tone: 'text-cyan-200 bg-cyan-400/10 border-cyan-400/20',
  },
  {
    label: 'Students evaluated',
    value: dashboardData.totalStudents.toString(),
    detail: 'Across completed execution runs',
    icon: UsersRound,
    tone: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/20',
  },
  {
    label: 'Pass rate',
    value: `${dashboardData.overallPassRate}%`,
    detail: 'Exact output matches',
    icon: CheckCircle2,
    tone: 'text-lime-200 bg-lime-400/10 border-lime-400/20',
  },
  {
    label: 'Configurations',
    value: dashboardData.configurations.toString(),
    detail: 'Compile and run profiles',
    icon: Settings2,
    tone: 'text-amber-200 bg-amber-400/10 border-amber-400/20',
  },
];

const statusBreakdown = [
  { label: 'Passed', value: dashboardData.passCount, percent: 78, className: 'bg-emerald-400' },
  { label: 'Needs review', value: dashboardData.failCount, percent: 18, className: 'bg-red-400' },
  { label: 'Pending', value: dashboardData.pendingCount, percent: 4, className: 'bg-amber-300' },
];

const nextActions = [
  {
    title: 'Create project',
    description: 'Start a new assignment with expected output and a language profile.',
    href: '/projects',
    icon: FolderPlus,
  },
  {
    title: 'Manage configurations',
    description: 'Prepare compile and run commands before importing submissions.',
    href: '/configurations',
    icon: Settings2,
  },
  {
    title: 'Import submissions',
    description: 'Select a ZIP directory from a project detail screen.',
    href: '/projects',
    icon: FileArchive,
  },
];

function formatLastRun(value: string | null) {
  if (!value) {
    return 'Not run yet';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatusVariant(status: RecentProject['status']) {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'in-progress') {
    return 'warning';
  }

  return 'outline';
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                CE316 evaluation workspace
              </Badge>
              <Badge variant="secondary">UI preview data</Badge>
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
                Assignment runs, submissions, and result health in one place.
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                Review batch execution readiness, recent project outcomes, and the next setup actions before running compile, execute, and compare workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/projects" className={cn(buttonVariants({ size: 'lg' }))}>
                <FolderPlus aria-hidden="true" />
                New project
              </Link>
              <Link to="/configurations" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
                <Settings2 aria-hidden="true" />
                Configure languages
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current readiness</p>
                <p className="mt-1 text-2xl font-semibold">Operational</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Evaluation coverage</span>
                  <span className="font-medium">{dashboardData.overallPassRate}%</span>
                </div>
                <Progress value={dashboardData.overallPassRate} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {statusBreakdown.map((item) => (
                  <div key={item.label} className="rounded-md border border-border bg-card/70 p-3">
                    <p className="text-lg font-semibold">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="bg-card/85">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl">{item.value}</CardTitle>
                </div>
                <div className={cn('flex size-11 items-center justify-center rounded-lg border', item.tone)}>
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="bg-card/85">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Recent projects</CardTitle>
              <CardDescription>Latest assignment batches from the planned project workflow.</CardDescription>
            </div>
            <Link to="/projects" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}>
              View all
              <ArrowRight aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.7fr] border-b border-border bg-secondary/50 px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>Project</span>
                <span>Config</span>
                <span>Students</span>
                <span>Pass rate</span>
                <span>Last run</span>
              </div>
              <div className="divide-y divide-border">
                {dashboardData.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="grid grid-cols-[1.5fr_0.8fr_0.7fr_0.7fr_0.7fr] items-center gap-4 px-4 py-4 text-sm transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={getStatusVariant(project.status)} className="shrink-0 capitalize">
                          {project.status.replace('-', ' ')}
                        </Badge>
                        <p className="truncate text-xs text-muted-foreground">{project.configuration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Code2 className="size-4" aria-hidden="true" />
                      {project.language}
                    </div>
                    <span>{project.studentCount}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.passRate}%</span>
                        <span className="text-xs text-muted-foreground">{project.trend}</span>
                      </div>
                      <Progress value={project.passRate} className="mt-2 h-1.5" />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 className="size-4" aria-hidden="true" />
                      <span>{formatLastRun(project.lastRun)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/85">
            <CardHeader>
              <CardTitle>Result health</CardTitle>
              <CardDescription>Distribution across the latest completed project runs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusBreakdown.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn('size-2.5 rounded-full', item.className)} />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium">{item.percent}%</span>
                  </div>
                  <Progress value={item.percent} className="[&>div]:bg-cyan-300" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardHeader>
              <CardTitle>Next actions</CardTitle>
              <CardDescription>Common lecturer tasks for the evaluation cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group flex min-h-20 items-start gap-3 rounded-lg border border-border bg-background/35 p-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-cyan-100">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium group-hover:text-cyan-100">{action.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
              <Link to="/projects" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full')}>
                <PlayCircle aria-hidden="true" />
                Open project workspace
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
