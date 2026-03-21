---
layout: page
permalink: /projects/
title: Projects
description: A growing collection of my academic and personal projects.
nav: true
nav_order: 4
display_categories: [research, coursework, fun]
horizontal: false
---

<style>
  .project-link-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: var(--global-bg-color-secondary);
    border: 1px solid var(--global-border-color);
    color: var(--link-color);
    text-decoration: none;
    margin-right: 0.25rem;
    margin-bottom: 0.25rem;
    transition: background 0.2s, border-color 0.2s;
  }
  .project-link-badge:hover {
    background: var(--link-hover-bg-color);
    border-color: var(--link-color);
    color: var(--link-color);
  }
</style>

<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  {% for category in page.display_categories %}
  {% assign categorized_projects = site.projects | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  {% if sorted_projects.size > 0 %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category text-capitalize">{{ category }}</h2>
  </a>
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}
{% else %}
  {% assign sorted_projects = site.projects | sort: "importance" %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
{% endif %}
</div>
