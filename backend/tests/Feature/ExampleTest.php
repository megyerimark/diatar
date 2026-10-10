<?php
namespace Tests\Feature;
use Tests\TestCase;
class ExampleTest extends TestCase {
    public function test_health_endpoint(): void { $this->getJson('/api/health')->assertOk()->assertJson(['service'=>'Diatár','ok'=>true]); }
}
